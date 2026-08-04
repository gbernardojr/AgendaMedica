using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.Net;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Listen(IPAddress.Loopback, 5000);
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.EnableSensitiveDataLogging(false);
    options.EnableDetailedErrors(false);
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "dev-secret-key"))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Host.UseWindowsService();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    await UpdateSchemaAsync(db);
    await CreateAdminUserAsync(db);
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run("http://0.0.0.0:5000");

async Task UpdateSchemaAsync(AppDbContext db)
{
    try
    {
        var columns = new[] { "perm_agenda", "perm_clientes", "perm_profissionais", "perm_procedimentos" };
        foreach (var col in columns)
        {
            await db.Database.ExecuteSqlRawAsync($@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Usuarios') AND name = '{col}')
                ALTER TABLE Usuarios ADD {col} BIT DEFAULT 1");
        }

        await db.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('caixa') AND name = 'med_crm')
            ALTER TABLE caixa ADD med_crm VARCHAR(20) NULL");
        
        await db.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('agenda') AND name = 'ag_codpaciente')
            ALTER TABLE agenda ADD ag_codpaciente INT NULL");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Schema update error: {ex.Message}");
    }
}

async Task CreateAdminUserAsync(AppDbContext db)
{
    var admin = await db.Usuarios.FirstOrDefaultAsync(u => u.usu_username == "admin");
    if (admin == null)
    {
        db.Usuarios.Add(new Usuario
        {
            usu_id = 1,
            usu_username = "admin",
            usu_senha = BCrypt.Net.BCrypt.HashPassword("admin123"),
            usu_nome = "Admin",
            usu_admin = "S",
            perm_agenda = true,
            perm_clientes = true,
            perm_profissionais = false,
            perm_procedimentos = false
        });
        await db.SaveChangesAsync();
    }
    else
    {
        bool needsSave = false;
        if (string.IsNullOrEmpty(admin.usu_senha))
        {
            admin.usu_senha = BCrypt.Net.BCrypt.HashPassword("admin123");
            needsSave = true;
        }
        if (!admin.perm_agenda.HasValue)
        {
            admin.perm_agenda = true;
            needsSave = true;
        }
        if (!admin.perm_clientes.HasValue)
        {
            admin.perm_clientes = true;
            needsSave = true;
        }
        if (!admin.perm_profissionais.HasValue)
        {
            admin.perm_profissionais = false;
            needsSave = true;
        }
        if (!admin.perm_procedimentos.HasValue)
        {
            admin.perm_procedimentos = false;
            needsSave = true;
        }
        if (needsSave)
            await db.SaveChangesAsync();
    }
}

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Procedimento> Procedimentos => Set<Procedimento>();
    public DbSet<Profissional> Profissionais => Set<Profissional>();
    public DbSet<Paciente> Pacientes => Set<Paciente>();
    public DbSet<Agendamento> Agendamentos => Set<Agendamento>();
    public DbSet<Caixa> Caixas => Set<Caixa>();
    public DbSet<Log> Logs => Set<Log>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(e =>
        {
            e.ToTable("Usuarios");
            e.HasKey(u => u.usu_id);
            e.Property(u => u.usu_id).ValueGeneratedNever();
            e.Property(u => u.usu_username).HasMaxLength(15);
            e.Property(u => u.usu_senha).HasMaxLength(255);
            e.Property(u => u.usu_nome).HasMaxLength(80);
            e.Property(u => u.usu_admin).HasMaxLength(1);
        });

        modelBuilder.Entity<Procedimento>(e =>
        {
            e.ToTable("procedimentos");
            e.HasKey(p => p.proc_id);
            e.Property(p => p.proc_id).ValueGeneratedNever();
            e.Property(p => p.proc_nome).HasColumnName("proc_descricao").HasMaxLength(100).IsRequired();
            e.Property(p => p.proc_valor).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Profissional>(e =>
        {
            e.ToTable("medicos");
            e.HasKey(p => p.med_crm);
            e.Property(p => p.med_crm).HasMaxLength(20);
            e.Property(p => p.med_nome).HasMaxLength(100);
        });

        modelBuilder.Entity<Paciente>(e =>
        {
            e.ToTable("pacientes");
            e.HasKey(p => p.pac_id);
            e.Property(p => p.pac_id).ValueGeneratedNever();
            e.Property(p => p.pac_nome).HasMaxLength(100);
            e.Property(p => p.pac_sexo).HasMaxLength(1);
            e.Property(p => p.pac_cpf).HasMaxLength(20);
            e.Property(p => p.pac_rg).HasMaxLength(20);
            e.Property(p => p.pac_endereco).HasMaxLength(200);
            e.Property(p => p.pac_numero).HasMaxLength(10);
            e.Property(p => p.pac_complemento).HasMaxLength(100);
            e.Property(p => p.pac_bairro).HasMaxLength(100);
            e.Property(p => p.pac_cidade).HasMaxLength(100);
            e.Property(p => p.pac_estado).HasMaxLength(2);
            e.Property(p => p.pac_cep).HasMaxLength(10);
            e.Property(p => p.pac_telefone).HasMaxLength(20);
            e.Property(p => p.pac_celular).HasMaxLength(20);
            e.Property(p => p.pac_email).HasMaxLength(100);
            e.Property(p => p.pac_nomemae).HasMaxLength(100);
        });

        modelBuilder.Entity<Agendamento>(e =>
        {
            e.ToTable("agenda");
            e.HasKey(a => a.ag_codigo);
            e.Property(a => a.ag_codigo).ValueGeneratedNever();
            e.Property(a => a.ag_tipoconsulta).HasColumnName("ag_tipoconsulta").HasMaxLength(1);
            e.Property(a => a.ag_localizacao).HasColumnName("ag_localizacao").HasMaxLength(1);
        });

        modelBuilder.Entity<Caixa>(e =>
        {
            e.ToTable("caixa");
            e.HasKey(c => c.id);
            e.Property(c => c.valor).HasPrecision(18, 2);
            e.Property(c => c.forma_pagto).HasMaxLength(50);
            e.Property(c => c.pagante).HasMaxLength(100);
            e.Property(c => c.med_crm).HasMaxLength(20);
            e.Property(c => c.cx_nf).HasMaxLength(1);
            e.Property(c => c.cx_numerocheque2).HasColumnName("cx_numerocheque2");
            e.Property(c => c.cx_emissorcheque).HasMaxLength(100);
            e.Property(c => c.cx_cpfemissorcheque2).HasColumnName("cx_cpfemissorcheque2").HasMaxLength(15);
            e.Property(c => c.cx_bancocheque).HasMaxLength(50);
            e.Property(c => c.cx_agenciacheque).HasMaxLength(20);
            e.Property(c => c.cx_contacheque).HasMaxLength(20);
            e.Property(c => c.cx_chequeterceiro).HasMaxLength(1);
        });

        modelBuilder.Entity<Log>(e =>
        {
            e.ToTable("Logs");
            e.HasKey(l => l.id);
            e.Property(l => l.acao).HasMaxLength(100);
            e.Property(l => l.tabela).HasMaxLength(50);
            e.Property(l => l.ip).HasMaxLength(45);
        });
    }
}

public class Usuario
{
    public int usu_id { get; set; }
    public string? usu_username { get; set; }
    public string? usu_senha { get; set; }
    public string? usu_nome { get; set; }
    public string? usu_admin { get; set; }
    public bool? perm_agenda { get; set; }
    public bool? perm_clientes { get; set; }
    public bool? perm_profissionais { get; set; }
    public bool? perm_procedimentos { get; set; }
    
    [NotMapped]
    public bool admin { get; set; }
}

public class Procedimento
{
    public int proc_id { get; set; }
    public string proc_nome { get; set; } = "";
    public decimal? proc_valor { get; set; }
}

public class Profissional
{
    public string med_crm { get; set; } = "";
    public string med_nome { get; set; } = "";
}

public class Paciente
{
    public int pac_id { get; set; }
    public string pac_nome { get; set; } = "";
    public string? pac_sexo { get; set; }
    public DateTime? pac_nascimento { get; set; }
    public string? pac_cpf { get; set; }
    public string? pac_rg { get; set; }
    public string? pac_endereco { get; set; }
    public string? pac_numero { get; set; }
    public string? pac_complemento { get; set; }
    public string? pac_bairro { get; set; }
    public string? pac_cidade { get; set; }
    public string? pac_estado { get; set; }
    public string? pac_cep { get; set; }
    public string? pac_telefone { get; set; }
    public string? pac_celular { get; set; }
    public string? pac_email { get; set; }
    public string? pac_nomemae { get; set; }
    public string? pac_obs { get; set; }
}

public class Agendamento
{
    public int ag_codigo { get; set; }
    public DateTime? ag_data { get; set; }
    public string? ag_hora { get; set; }
    public string? ag_nome { get; set; }
    public int ag_status { get; set; } = 1;
    public bool ag_pago { get; set; }
    public string? ag_obs { get; set; }
    public string? ag_convenio { get; set; }
    public int? ag_codmedico { get; set; }
    public int? ag_codpaciente { get; set; }
    public string? ag_tipoconsulta { get; set; }
    public string? ag_localizacao { get; set; }
}

public class Caixa
{
    public int id { get; set; }
    public DateTime data { get; set; }
    public decimal valor { get; set; }
    public string forma_pagto { get; set; } = "";
    public int? ag_codigo { get; set; }
    public string? pagante { get; set; }
    public string? med_crm { get; set; }
    public string? cx_nf { get; set; }
    public string? cx_numerocheque2 { get; set; }
    public string? cx_emissorcheque { get; set; }
    public string? cx_cpfemissorcheque2 { get; set; }
    public string? cx_bancocheque { get; set; }
    public string? cx_agenciacheque { get; set; }
    public string? cx_contacheque { get; set; }
    public string? cx_chequeterceiro { get; set; }
    public DateTime? cx_chequebompara { get; set; }
}

public class Log
{
    public int id { get; set; }
    public DateTime data_hora { get; set; }
    public int? usuario_id { get; set; }
    public string acao { get; set; } = "";
    public string? tabela { get; set; }
    public int? registro_id { get; set; }
    public string? ip { get; set; }
}
