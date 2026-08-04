using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CaixaController : ControllerBase
{
    private readonly AppDbContext _db;

    public CaixaController(AppDbContext db) => _db = db;

    [HttpGet("valorprocedimento")]
    public async Task<IActionResult> GetValorProcedimento([FromQuery] int ag_codigo)
    {
        var agendamento = await _db.Agendamentos.FindAsync(ag_codigo);
        if (agendamento == null)
            return NotFound(new { msg = "Agendamento não encontrado" });

        var observacao = agendamento.ag_obs?.Trim().ToLower() ?? "";
        if (string.IsNullOrEmpty(observacao))
            return Ok(new { valor = 0m });

        var procedimentos = await _db.Procedimentos.ToListAsync();
        var procedimentoEncontrado = procedimentos.FirstOrDefault(p => 
            !string.IsNullOrEmpty(p.proc_nome) && observacao.Contains(p.proc_nome.ToLower()));

        if (procedimentoEncontrado != null)
            return Ok(new { valor = procedimentoEncontrado.proc_valor ?? 0m });

        return Ok(new { valor = 0m });
    }

    [HttpPost("receber")]
    public async Task<IActionResult> Receber([FromBody] ReceberRequest request)
    {
        try
        {
        Console.WriteLine($"[DEBUG] Receber request: ag_codigo={request.ag_codigo}, valor={request.valor}, forma_pagto={request.forma_pagto}");
        
        if (request.valor < 0)
            return BadRequest(new { msg = "Valor não pode ser negativo" });
        
        var agendamento = await _db.Agendamentos.FindAsync(request.ag_codigo);
        if (agendamento == null)
            return NotFound(new { msg = "Agendamento não encontrado" });

        if (!agendamento.ag_codpaciente.HasValue && !string.IsNullOrEmpty(agendamento.ag_nome))
        {
            var pacienteExistente = await _db.Pacientes.FirstOrDefaultAsync(p => p.pac_nome == agendamento.ag_nome.Trim());
            if (pacienteExistente != null)
            {
                agendamento.ag_codpaciente = pacienteExistente.pac_id;
            }
            else
            {
                var maxPacId = await _db.Pacientes.MaxAsync(p => (int?)p.pac_id) ?? 0;
                var novoPaciente = new Paciente
                {
                    pac_id = maxPacId + 1,
                    pac_nome = agendamento.ag_nome.Trim()
                };
                _db.Pacientes.Add(novoPaciente);
                await _db.SaveChangesAsync();
                agendamento.ag_codpaciente = novoPaciente.pac_id;
                agendamento.ag_nome = novoPaciente.pac_nome;
            }
        }

        if (!agendamento.ag_codpaciente.HasValue)
        {
            return BadRequest(new { msg = "Paciente não cadastrado. Cadastre o paciente para registrar o pagamento." });
        }

        DateTime dataPagto = DateTime.Now;
        if (!string.IsNullOrEmpty(request.data_pagto))
        {
            var parts = request.data_pagto.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[0], out int year) && int.TryParse(parts[1], out int month) && int.TryParse(parts[2], out int day))
            {
                dataPagto = new DateTime(year, month, day, DateTime.Now.Hour, DateTime.Now.Minute, DateTime.Now.Second);
            }
        }

        DateTime? chequeBomPara = null;
        if (!string.IsNullOrEmpty(request.cx_chequebompara))
        {
            var chequeParts = request.cx_chequebompara.Split('-');
            if (chequeParts.Length == 3 && int.TryParse(chequeParts[0], out int y) && int.TryParse(chequeParts[1], out int m) && int.TryParse(chequeParts[2], out int d))
            {
                chequeBomPara = new DateTime(y, m, d);
            }
        }

        var caixa = new Caixa
        {
            valor = request.valor,
            forma_pagto = request.forma_pagto ?? "",
            ag_codigo = request.ag_codigo,
            pagante = request.pagante ?? agendamento.ag_nome,
            med_crm = agendamento.ag_codmedico.HasValue ? agendamento.ag_codmedico.Value.ToString() : null,
            data = dataPagto,
            cx_nf = (request.cx_nf?.ToString().ToLower() == "true" || request.cx_nf?.ToString() == "1" || request.cx_nf?.ToString().ToLower() == "s") ? "S" : "N",
            cx_numerocheque2 = request.cx_numerocheque2,
            cx_emissorcheque = request.cx_emissorcheque,
            cx_cpfemissorcheque2 = request.cx_cpfemissorcheque2,
            cx_bancocheque = request.cx_bancocheque,
            cx_agenciacheque = request.cx_agenciacheque,
            cx_contacheque = request.cx_contacheque,
            cx_chequeterceiro = (request.cx_chequeterceiro?.ToString().ToLower() == "true" || request.cx_chequeterceiro?.ToString() == "1" || request.cx_chequeterceiro?.ToString().ToLower() == "s") ? "S" : "N",
            cx_chequebompara = chequeBomPara
        };

        _db.Caixas.Add(caixa);
        agendamento.ag_pago = true;
        await _db.SaveChangesAsync();

        return Ok(new { id = caixa.id, ag_codpaciente = agendamento.ag_codpaciente });
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException?.Message ?? ex.Message;
            Console.WriteLine($"[ERROR] Receber: {ex.Message}");
            Console.WriteLine($"[ERROR] Inner: {innerMsg}");
            Console.WriteLine($"[ERROR] Stack: {ex.StackTrace}");
            return StatusCode(500, new { msg = "Erro ao processar recebimento: " + innerMsg });
        }
    }
}

public class ReceberRequest
{
    public int ag_codigo { get; set; }
    public decimal valor { get; set; }
    public string forma_pagto { get; set; } = "";
    public string? pagante { get; set; }
    public string? data_pagto { get; set; }
    public object? cx_nf { get; set; }
    public string? cx_numerocheque2 { get; set; }
    public string? cx_emissorcheque { get; set; }
    public string? cx_cpfemissorcheque2 { get; set; }
    public string? cx_bancocheque { get; set; }
    public string? cx_agenciacheque { get; set; }
    public string? cx_contacheque { get; set; }
    public object? cx_chequeterceiro { get; set; }
    public string? cx_chequebompara { get; set; }
}
