using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using System.Linq;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AgendamentosController : ControllerBase
{
    private readonly AppDbContext _db;

    public AgendamentosController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? data, [FromQuery] string? profissional_crm)
    {
        try
        {
            // Busca campos básicos (sempre existem)
            var result = new List<AgendamentoResponse>();

            try
            {
                // Tentar buscar os novos campos junto com os antigos
                var sqlWithNewFields = "SELECT ag_codigo, ag_data, ag_hora, ag_nome, ag_status, ag_pago, ag_obs, ag_convenio, ag_codmedico, ag_codpaciente, ag_tipoconsulta, ag_localizacao FROM agenda";
                result = await _db.Database.SqlQueryRaw<AgendamentoResponse>(sqlWithNewFields).ToListAsync();
            }
            catch (Exception)
            {
                // Se falhar, buscar apenas campos antigos
                try
                {
                    var sqlOldFields = "SELECT ag_codigo, ag_data, ag_hora, ag_nome, ag_status, ag_pago, ag_obs, ag_convenio, ag_codmedico, ag_codpaciente FROM agenda";
                    var oldResult = await _db.Database.SqlQueryRaw<AgendamentoResponseOld>(sqlOldFields).ToListAsync();
                    result = oldResult.Select(a => new AgendamentoResponse
                    {
                        ag_codigo = a.ag_codigo,
                        ag_data = a.ag_data,
                        ag_hora = a.ag_hora,
                        ag_nome = a.ag_nome,
                        ag_status = a.ag_status,
                        ag_pago = a.ag_pago,
                        ag_obs = a.ag_obs,
                        ag_convenio = a.ag_convenio,
                        ag_codmedico = a.ag_codmedico,
                        ag_codpaciente = a.ag_codpaciente,
                        ag_tipoconsulta = "C",
                        ag_localizacao = "S"
                    }).ToList();
                }
                catch (Exception ex2)
                {
                    return StatusCode(500, new { error = "Erro ao buscar agendamentos: " + ex2.Message });
                }
            }
            
            // Filter by profissional
            if (!string.IsNullOrEmpty(profissional_crm))
            {
                if (int.TryParse(profissional_crm, out int crmInt))
                {
                    result = result.Where(x => x.ag_codmedico == crmInt).ToList();
                }
            }
            
            // Filter by date
            if (!string.IsNullOrEmpty(data))
            {
                var datePart = data.Length >= 10 ? data.Substring(0, 10) : data;
                if (DateTime.TryParse(datePart, out var filterDate))
                {
                    result = result.Where(x => x.ag_data.HasValue && x.ag_data.Value.Date == filterDate.Date).ToList();
                }
            }
            
            var response = result.Select(a => new
            {
                ag_codigo = a.ag_codigo,
                ag_data = a.ag_data?.ToString("yyyy-MM-ddTHH:mm:ss"),
                ag_hora = a.ag_hora,
                ag_nome = a.ag_nome,
                ag_status = a.ag_status,
                ag_pago = a.ag_pago,
                ag_obs = a.ag_obs,
                ag_codmedico = a.ag_codmedico?.ToString(),
                ag_codpaciente = a.ag_codpaciente,
                ag_valor = 0m,
                ag_convenio = a.ag_convenio,
                ag_tipoconsulta = a.ag_tipoconsulta,
                ag_localizacao = a.ag_localizacao
            }).ToList();
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AgendamentoDto dto)
    {
        Console.WriteLine($"[DEBUG] POST /agendamentos - ag_data: '{dto.ag_data}', ag_hora: '{dto.ag_hora}', ag_nome: '{dto.ag_nome}', ag_codmedico: '{dto.ag_codmedico}'");
        
        var maxId = await _db.Agendamentos.MaxAsync(a => (int?)a.ag_codigo) ?? 0;
        
        DateTime? data = null;
        if (!string.IsNullOrEmpty(dto.ag_data))
        {
            var parts = dto.ag_data.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[0], out int year) && int.TryParse(parts[1], out int month) && int.TryParse(parts[2], out int day))
            {
                data = new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Unspecified);
                Console.WriteLine($"[DEBUG] Parsed date: {data}");
            }
        }

        int? codPaciente = null;
        string? nomePaciente = dto.ag_nome;

        if (!string.IsNullOrEmpty(dto.ag_nome))
        {
            var pacienteExistente = await _db.Pacientes.FirstOrDefaultAsync(p => p.pac_nome == dto.ag_nome.Trim());
            if (pacienteExistente != null)
            {
                codPaciente = pacienteExistente.pac_id;
                nomePaciente = pacienteExistente.pac_nome;
                Console.WriteLine($"[DEBUG] Paciente encontrado: ID {codPaciente}, Nome: {nomePaciente}");
            }
            else
            {
                var maxPacId = await _db.Pacientes.MaxAsync(p => (int?)p.pac_id) ?? 0;
                var novoPaciente = new Paciente
                {
                    pac_id = maxPacId + 1,
                    pac_nome = dto.ag_nome.Trim()
                };
                _db.Pacientes.Add(novoPaciente);
                await _db.SaveChangesAsync();
                codPaciente = novoPaciente.pac_id;
                Console.WriteLine($"[DEBUG] Novo paciente criado: ID {codPaciente}, Nome: {nomePaciente}");
            }
        }
        
        var agendamento = new Agendamento
        {
            ag_codigo = maxId + 1,
            ag_data = data,
            ag_hora = dto.ag_hora,
            ag_nome = nomePaciente,
            ag_obs = dto.ag_observacao,
            ag_convenio = dto.ag_convenio,
            ag_codmedico = !string.IsNullOrEmpty(dto.ag_codmedico) && int.TryParse(dto.ag_codmedico, out int crm) ? crm : null,
            ag_codpaciente = codPaciente,
            ag_status = 1,
            ag_pago = false,
            ag_tipoconsulta = string.IsNullOrEmpty(dto.ag_tipoconsulta) ? "C" : dto.ag_tipoconsulta,
            ag_localizacao = string.IsNullOrEmpty(dto.ag_localizacao) ? "S" : dto.ag_localizacao
        };

        _db.Agendamentos.Add(agendamento);
        await _db.SaveChangesAsync();
        
        Console.WriteLine($"[DEBUG] Created agendamento id: {agendamento.ag_codigo}, data: {agendamento.ag_data}, hora: {agendamento.ag_hora}, nome: {agendamento.ag_nome}, paciente: {codPaciente}");
        
        return Ok(new { id = agendamento.ag_codigo, ag_codpaciente = codPaciente });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AgendamentoDto dto)
    {
        Console.WriteLine($"[DEBUG] PUT /agendamentos/{id} - ag_data: {dto.ag_data}, ag_hora: {dto.ag_hora}, ag_nome: {dto.ag_nome}, ag_codmedico: {dto.ag_codmedico}, ag_status: {dto.ag_status}, ag_pago: {dto.ag_pago}");
        
        var existing = await _db.Agendamentos.FindAsync(id);
        if (existing == null) return NotFound();

        bool needsPatientCreation = false;
        string? novoNomePaciente = null;
        int? novoCodPaciente = null;

        if (dto.ag_status > 0 && !existing.ag_codpaciente.HasValue && !string.IsNullOrEmpty(existing.ag_nome))
        {
            needsPatientCreation = true;
            var maxPacId = await _db.Pacientes.MaxAsync(p => (int?)p.pac_id) ?? 0;
            var novoPaciente = new Paciente
            {
                pac_id = maxPacId + 1,
                pac_nome = existing.ag_nome.Trim()
            };
            _db.Pacientes.Add(novoPaciente);
            await _db.SaveChangesAsync();
            novoCodPaciente = novoPaciente.pac_id;
            novoNomePaciente = novoPaciente.pac_nome;
            existing.ag_codpaciente = novoCodPaciente;
            existing.ag_nome = novoNomePaciente;
            Console.WriteLine($"[DEBUG] Paciente criado automaticamente: ID {novoCodPaciente}, Nome: {novoNomePaciente}");
        }

        if (!string.IsNullOrEmpty(dto.ag_data))
        {
            var parts = dto.ag_data.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[0], out int year) && int.TryParse(parts[1], out int month) && int.TryParse(parts[2], out int day))
            {
                existing.ag_data = new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Local);
            }
        }
        if (!string.IsNullOrEmpty(dto.ag_hora))
            existing.ag_hora = dto.ag_hora;
        if (!string.IsNullOrEmpty(dto.ag_nome))
            existing.ag_nome = dto.ag_nome;
        
        if (dto.ag_pago)
            existing.ag_pago = true;
        else if (dto.ag_pago == false)
            existing.ag_pago = false;
            
        if (dto.ag_status > 0)
            existing.ag_status = dto.ag_status;
        if (!string.IsNullOrEmpty(dto.ag_observacao))
            existing.ag_obs = dto.ag_observacao;
        if (!string.IsNullOrEmpty(dto.ag_codmedico))
        {
            if (int.TryParse(dto.ag_codmedico, out int crmInt))
                existing.ag_codmedico = crmInt;
        }
        if (!string.IsNullOrEmpty(dto.ag_convenio))
            existing.ag_convenio = dto.ag_convenio;
        if (dto.ag_tipoconsulta != null)
            existing.ag_tipoconsulta = dto.ag_tipoconsulta;
        if (dto.ag_localizacao != null)
            existing.ag_localizacao = dto.ag_localizacao;

        _db.Entry(existing).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        
        Console.WriteLine($"[DEBUG] Updated agendamento id: {existing.ag_codigo}, data: {existing.ag_data}, hora: {existing.ag_hora}, nome: {existing.ag_nome}, status: {existing.ag_status}");

        if (needsPatientCreation)
        {
            return Ok(new { msg = "ok", paciente_criado = true, ag_codpaciente = novoCodPaciente, ag_nome = novoNomePaciente });
        }
        
        return Ok(new { msg = "ok" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var agendamento = await _db.Agendamentos.FindAsync(id);
        if (agendamento == null) return NotFound();

        _db.Agendamentos.Remove(agendamento);
        await _db.SaveChangesAsync();
        return Ok(new { msg = "ok" });
    }
}

public class AgendamentoResponse
{
    public int ag_codigo { get; set; }
    public DateTime? ag_data { get; set; }
    public string? ag_hora { get; set; }
    public string? ag_nome { get; set; }
    public int ag_status { get; set; }
    public bool ag_pago { get; set; }
    public string? ag_obs { get; set; }
    public string? ag_convenio { get; set; }
    public int? ag_codmedico { get; set; }
    public int? ag_codpaciente { get; set; }
    public string? ag_tipoconsulta { get; set; }
    public string? ag_localizacao { get; set; }
}

public class AgendamentoResponseOld
{
    public int ag_codigo { get; set; }
    public DateTime? ag_data { get; set; }
    public string? ag_hora { get; set; }
    public string? ag_nome { get; set; }
    public int ag_status { get; set; }
    public bool ag_pago { get; set; }
    public string? ag_obs { get; set; }
    public string? ag_convenio { get; set; }
    public int? ag_codmedico { get; set; }
    public int? ag_codpaciente { get; set; }
}

public class AgendamentoDto
{
    [JsonPropertyName("ag_data")]
    public string? ag_data { get; set; }
    
    [JsonPropertyName("ag_hora")]
    public string? ag_hora { get; set; }
    
    [JsonPropertyName("ag_nome")]
    public string? ag_nome { get; set; }
    
    [JsonPropertyName("ag_observacao")]
    public string? ag_observacao { get; set; }
    
    [JsonPropertyName("ag_convenio")]
    public string? ag_convenio { get; set; }
    
    [JsonPropertyName("ag_codmedico")]
    public string? ag_codmedico { get; set; }
    
    [JsonPropertyName("ag_codpaciente")]
    public int? ag_codpaciente { get; set; }
    
    [JsonPropertyName("ag_status")]
    public int ag_status { get; set; }
    
    [JsonPropertyName("ag_pago")]
    public bool ag_pago { get; set; }

    [JsonPropertyName("ag_tipoconsulta")]
    public string? ag_tipoconsulta { get; set; }

    [JsonPropertyName("ag_localizacao")]
    public string? ag_localizacao { get; set; }
}
