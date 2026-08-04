using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PacientesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PacientesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? q)
    {
        var query = _db.Pacientes.AsQueryable();
        if (!string.IsNullOrEmpty(q))
            query = query.Where(p => p.pac_nome.Contains(q) || p.pac_telefone.Contains(q));

        var pacientes = await query.ToListAsync();
        return Ok(pacientes.Select(p => new
        {
            id = p.pac_id,
            nome = p.pac_nome,
            tel = p.pac_telefone,
            email = p.pac_email,
            pac_sexo = p.pac_sexo,
            pac_nascimento = p.pac_nascimento?.ToString("yyyy-MM-dd"),
            pac_cpf = p.pac_cpf,
            pac_rg = p.pac_rg,
            pac_endereco = p.pac_endereco,
            pac_numero = p.pac_numero,
            pac_complemento = p.pac_complemento,
            pac_bairro = p.pac_bairro,
            pac_cidade = p.pac_cidade,
            pac_estado = p.pac_estado,
            pac_cep = p.pac_cep,
            pac_celular = p.pac_celular,
            pac_nomemae = p.pac_nomemae,
            pac_obs = p.pac_obs
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Paciente paciente)
    {
        var maxId = await _db.Pacientes.MaxAsync(p => (int?)p.pac_id) ?? 0;
        paciente.pac_id = maxId + 1;
        
        _db.Pacientes.Add(paciente);
        await _db.SaveChangesAsync();
        return Ok(new { id = paciente.pac_id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Paciente paciente)
    {
        var existing = await _db.Pacientes.FindAsync(id);
        if (existing == null) return NotFound();

        existing.pac_nome = paciente.pac_nome;
        existing.pac_sexo = paciente.pac_sexo;
        existing.pac_nascimento = paciente.pac_nascimento;
        existing.pac_cpf = paciente.pac_cpf;
        existing.pac_rg = paciente.pac_rg;
        existing.pac_endereco = paciente.pac_endereco;
        existing.pac_numero = paciente.pac_numero;
        existing.pac_complemento = paciente.pac_complemento;
        existing.pac_bairro = paciente.pac_bairro;
        existing.pac_cidade = paciente.pac_cidade;
        existing.pac_estado = paciente.pac_estado;
        existing.pac_cep = paciente.pac_cep;
        existing.pac_telefone = paciente.pac_telefone;
        existing.pac_celular = paciente.pac_celular;
        existing.pac_email = paciente.pac_email;
        existing.pac_nomemae = paciente.pac_nomemae;
        existing.pac_obs = paciente.pac_obs;

        await _db.SaveChangesAsync();
        return Ok(new { msg = "ok" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var paciente = await _db.Pacientes.FindAsync(id);
        if (paciente == null) return NotFound();

        _db.Pacientes.Remove(paciente);
        await _db.SaveChangesAsync();
        return Ok(new { msg = "ok" });
    }
}
