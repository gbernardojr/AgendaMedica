using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportsController(AppDbContext db) => _db = db;

    [HttpGet("agenda-diaria")]
    public async Task<IActionResult> AgendaDiaria([FromQuery] string? data, [FromQuery] string? profissional_crm)
    {
        try
        {
            DateTime dataRef;
            if (string.IsNullOrEmpty(data) || !DateTime.TryParse(data, out dataRef))
                dataRef = DateTime.Today;

            var start = dataRef.Date;
            var end = dataRef.Date.AddDays(1).AddSeconds(-1);

            var query = _db.Agendamentos.Where(a => a.ag_data >= start && a.ag_data <= end);

            if (!string.IsNullOrEmpty(profissional_crm))
            {
                if (int.TryParse(profissional_crm, out int crmInt))
                    query = query.Where(a => a.ag_codmedico == crmInt);
            }

            var agendamentos = await query.OrderBy(a => a.ag_hora).ToListAsync();

            var document = new PdfDocument();
            document.Info.Title = "Relatório de Agenda Diária";
            var page = document.AddPage();
            page.Size = PdfSharp.PageSize.A4;
            var gfx = XGraphics.FromPdfPage(page);
            
            var fontTitle = new XFont("Arial", 16, XFontStyleEx.Bold);
            var fontSubtitle = new XFont("Arial", 12, XFontStyleEx.Regular);
            var fontHeader = new XFont("Arial", 10, XFontStyleEx.Bold);
            var fontNormal = new XFont("Arial", 9, XFontStyleEx.Regular);

            gfx.DrawString("Relatório de Agenda Diária", fontTitle, XBrushes.Black, new XPoint(50, 40));
            gfx.DrawString($"Data: {dataRef:dd/MM/yyyy}", fontSubtitle, XBrushes.Black, new XPoint(50, 65));

            if (!string.IsNullOrEmpty(profissional_crm))
            {
                var prof = await _db.Profissionais.FindAsync(profissional_crm);
                gfx.DrawString($"Profissional: {prof?.med_nome ?? profissional_crm}", fontSubtitle, XBrushes.Black, new XPoint(50, 85));
            }

            int y = 120;
            gfx.DrawString("Hora", fontHeader, XBrushes.Black, new XPoint(50, y));
            gfx.DrawString("Paciente", fontHeader, XBrushes.Black, new XPoint(100, y));
            gfx.DrawString("Convênio", fontHeader, XBrushes.Black, new XPoint(280, y));
            gfx.DrawString("Tipo", fontHeader, XBrushes.Black, new XPoint(370, y));
            gfx.DrawString("Status", fontHeader, XBrushes.Black, new XPoint(450, y));
            gfx.DrawString("Pago", fontHeader, XBrushes.Black, new XPoint(530, y));

            gfx.DrawLine(XPens.Black, 50, y + 5, 570, y + 5);
            y += 20;

            foreach (var a in agendamentos)
            {
                if (y > 750)
                {
                    page = document.AddPage();
                    page.Size = PdfSharp.PageSize.A4;
                    gfx = XGraphics.FromPdfPage(page);
                    y = 50;
                }

                var status = a.ag_status == 1 ? "Agendado" : (a.ag_status == 2 ? "Em Atend." : "Finalizado");
                var tipo = a.ag_tipoconsulta == "C" ? "Consulta" : (a.ag_tipoconsulta == "P" ? "Procedimento" : a.ag_tipoconsulta ?? "-");

                gfx.DrawString(a.ag_hora ?? "-", fontNormal, XBrushes.Black, new XPoint(50, y));
                gfx.DrawString(a.ag_nome?.Length > 20 ? a.ag_nome.Substring(0, 20) : a.ag_nome ?? "-", fontNormal, XBrushes.Black, new XPoint(100, y));
                gfx.DrawString(a.ag_convenio ?? "-", fontNormal, XBrushes.Black, new XPoint(280, y));
                gfx.DrawString(tipo, fontNormal, XBrushes.Black, new XPoint(370, y));
                gfx.DrawString(status, fontNormal, XBrushes.Black, new XPoint(450, y));
                gfx.DrawString(a.ag_pago ? "Sim" : "Não", fontNormal, XBrushes.Black, new XPoint(530, y));

                y += 15;
            }

            gfx.DrawLine(XPens.Black, 50, y + 5, 570, y + 5);
            y += 15;
            gfx.DrawString($"Total de agendamentos: {agendamentos.Count}", fontHeader, XBrushes.Black, new XPoint(50, y));

            using var stream = new MemoryStream();
            document.Save(stream);
            return File(stream.ToArray(), "application/pdf", $"agenda_diaria_{dataRef:yyyyMMdd}.pdf");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { msg = "Erro ao gerar relatório", error = ex.Message });
        }
    }

    [HttpGet("agendamentos-paciente")]
    public async Task<IActionResult> AgendamentosPaciente([FromQuery] string? nome, [FromQuery] int? paciente_id)
    {
        try
        {
            if (string.IsNullOrEmpty(nome) && !paciente_id.HasValue)
                return BadRequest(new { msg = "Informe o nome ou ID do paciente" });

            List<Agendamento> agendamentos;

            if (paciente_id.HasValue)
            {
                agendamentos = await _db.Agendamentos
                    .Where(a => a.ag_codpaciente == paciente_id.Value)
                    .OrderByDescending(a => a.ag_data)
                    .ThenByDescending(a => a.ag_hora)
                    .ToListAsync();
            }
            else
            {
                agendamentos = await _db.Agendamentos
                    .Where(a => a.ag_nome != null && a.ag_nome.ToLower().Contains(nome.ToLower()))
                    .OrderByDescending(a => a.ag_data)
                    .ThenByDescending(a => a.ag_hora)
                    .ToListAsync();
            }

            if (!agendamentos.Any())
                return BadRequest(new { msg = "Nenhum agendamento encontrado para este paciente" });

            var primeiro = agendamentos.First();
            string nomePaciente = primeiro.ag_nome ?? "Paciente";
            string nomeProfissional = "-";

            if (primeiro.ag_codmedico.HasValue)
            {
                var prof = await _db.Profissionais.FindAsync(primeiro.ag_codmedico.Value.ToString());
                nomeProfissional = prof?.med_nome ?? primeiro.ag_codmedico.Value.ToString();
            }

            var document = new PdfDocument();
            document.Info.Title = "Relatório de Agendamentos por Paciente";
            var page = document.AddPage();
            page.Size = PdfSharp.PageSize.A4;
            var gfx = XGraphics.FromPdfPage(page);

            var fontTitle = new XFont("Arial", 16, XFontStyleEx.Bold);
            var fontSubtitle = new XFont("Arial", 12, XFontStyleEx.Regular);
            var fontHeader = new XFont("Arial", 10, XFontStyleEx.Bold);
            var fontNormal = new XFont("Arial", 9, XFontStyleEx.Regular);

            gfx.DrawString("Relatório de Agendamentos por Paciente", fontTitle, XBrushes.Black, new XPoint(50, 40));
            gfx.DrawString($"Paciente: {nomePaciente}", fontSubtitle, XBrushes.Black, new XPoint(50, 65));
            gfx.DrawString($"Profissional: {nomeProfissional}", fontSubtitle, XBrushes.Black, new XPoint(50, 85));

            int y = 120;
            gfx.DrawString("Data", fontHeader, XBrushes.Black, new XPoint(50, y));
            gfx.DrawString("Horário", fontHeader, XBrushes.Black, new XPoint(120, y));
            gfx.DrawString("Local", fontHeader, XBrushes.Black, new XPoint(190, y));
            gfx.DrawString("Tipo Consulta", fontHeader, XBrushes.Black, new XPoint(290, y));
            gfx.DrawString("Valor", fontHeader, XBrushes.Black, new XPoint(400, y));
            gfx.DrawString("Forma Pagto", fontHeader, XBrushes.Black, new XPoint(480, y));

            gfx.DrawLine(XPens.Black, 50, y + 5, 570, y + 5);
            y += 20;

            decimal totalValor = 0;

            foreach (var a in agendamentos)
            {
                if (y > 750)
                {
                    page = document.AddPage();
                    page.Size = PdfSharp.PageSize.A4;
                    gfx = XGraphics.FromPdfPage(page);
                    y = 50;
                }

                var caixa = await _db.Caixas.FirstOrDefaultAsync(c => c.ag_codigo == a.ag_codigo);
                var valor = caixa?.valor ?? 0;
                totalValor += valor;

                var tipo = a.ag_tipoconsulta == "C" ? "Consulta" : (a.ag_tipoconsulta == "P" ? "Procedimento" : a.ag_tipoconsulta ?? "-");
                var local = a.ag_localizacao == "1" ? "Consultório 1" : (a.ag_localizacao == "2" ? "Consultório 2" : "-");
                var formaPagto = caixa?.forma_pagto ?? "-";

                gfx.DrawString(a.ag_data?.ToString("dd/MM/yyyy") ?? "-", fontNormal, XBrushes.Black, new XPoint(50, y));
                gfx.DrawString(a.ag_hora ?? "-", fontNormal, XBrushes.Black, new XPoint(120, y));
                gfx.DrawString(local, fontNormal, XBrushes.Black, new XPoint(190, y));
                gfx.DrawString(tipo, fontNormal, XBrushes.Black, new XPoint(290, y));
                gfx.DrawString($"R$ {valor:F2}", fontNormal, XBrushes.Black, new XPoint(400, y));
                gfx.DrawString(formaPagto, fontNormal, XBrushes.Black, new XPoint(480, y));

                y += 15;
            }

            gfx.DrawLine(XPens.Black, 50, y + 5, 570, y + 5);
            y += 15;
            gfx.DrawString($"Total de agendamentos: {agendamentos.Count}", fontNormal, XBrushes.Black, new XPoint(50, y));
            y += 15;
            gfx.DrawString($"Valor Total: R$ {totalValor:F2}", fontHeader, XBrushes.Black, new XPoint(50, y));

            using var stream = new MemoryStream();
            document.Save(stream);
            return File(stream.ToArray(), "application/pdf", $"agendamentos_paciente_{nomePaciente.Replace(" ", "_")}.pdf");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR AgendamentosPaciente] {ex.Message}");
            return StatusCode(500, new { msg = "Erro ao gerar relatório", error = ex.Message });
        }
    }

    [HttpGet("caixa")]
    public async Task<IActionResult> RelatorioCaixa([FromQuery] string? data_inicio, [FromQuery] string? data_fim, [FromQuery] string? profissional_crm)
    {
        try
        {
            DateTime dataIni, dataFim;

            if (string.IsNullOrEmpty(data_inicio) || !DateTime.TryParse(data_inicio, out dataIni))
                dataIni = DateTime.Today.AddMonths(-1);
            if (string.IsNullOrEmpty(data_fim) || !DateTime.TryParse(data_fim, out dataFim))
                dataFim = DateTime.Today;

            var start = dataIni.Date;
            var end = dataFim.Date.AddDays(1).AddSeconds(-1);

            var query = _db.Caixas.Where(c => c.data >= start && c.data <= end);

            if (!string.IsNullOrEmpty(profissional_crm))
            {
                query = query.Where(c => c.med_crm != null && c.med_crm == profissional_crm);
            }

            var caixaList = await query.OrderBy(c => c.data).ToListAsync();

            if (!caixaList.Any())
            {
                return BadRequest(new { msg = "Nenhum registro de caixa encontrado no período" });
            }

            string nomeProfissional = "Todos";
            if (!string.IsNullOrEmpty(profissional_crm))
            {
                var prof = await _db.Profissionais.FindAsync(profissional_crm);
                nomeProfissional = prof?.med_nome ?? profissional_crm;
            }

            var document = new PdfDocument();
            document.Info.Title = "Relatório de Caixa";
            var page = document.AddPage();
            page.Size = PdfSharp.PageSize.A4;
            var gfx = XGraphics.FromPdfPage(page);

            var fontTitle = new XFont("Arial", 16, XFontStyleEx.Bold);
            var fontSubtitle = new XFont("Arial", 12, XFontStyleEx.Regular);
            var fontHeader = new XFont("Arial", 10, XFontStyleEx.Regular);
            var fontNormal = new XFont("Arial", 9, XFontStyleEx.Regular);
            var fontBold = new XFont("Arial", 10, XFontStyleEx.Bold);

            gfx.DrawString("Relatório de Caixa", fontTitle, XBrushes.Black, new XPoint(50, 40));
            gfx.DrawString($"Profissional: {nomeProfissional}", fontSubtitle, XBrushes.Black, new XPoint(50, 65));
            gfx.DrawString($"Período: {dataIni:dd/MM/yyyy} a {dataFim:dd/MM/yyyy}", fontSubtitle, XBrushes.Black, new XPoint(50, 85));

            int y = 120;
            gfx.DrawString("Data Receb.", fontBold, XBrushes.Black, new XPoint(50, y));
            gfx.DrawString("Observação", fontBold, XBrushes.Black, new XPoint(120, y));
            gfx.DrawString("Paciente", fontBold, XBrushes.Black, new XPoint(280, y));
            gfx.DrawString("Pago", fontBold, XBrushes.Black, new XPoint(390, y));
            gfx.DrawString("NF", fontBold, XBrushes.Black, new XPoint(440, y));
            gfx.DrawString("Valor", fontBold, XBrushes.Black, new XPoint(480, y));

            gfx.DrawLine(XPens.Black, 50, y + 5, 570, y + 5);
            y += 20;

            decimal totalGeral = 0;

            foreach (var c in caixaList)
            {
                if (y > 750)
                {
                    page = document.AddPage();
                    page.Size = PdfSharp.PageSize.A4;
                    gfx = XGraphics.FromPdfPage(page);
                    y = 50;
                }

                var agendamento = await _db.Agendamentos.FindAsync(c.ag_codigo);
                var pago = agendamento?.ag_pago == true ? "Sim" : "Não";
                var nf = c.cx_nf?.ToString().ToLower() == "true" || c.cx_nf?.ToString() == "1" || c.cx_nf?.ToString().ToLower() == "s" ? "Sim" : "Não";
                var obs = agendamento?.ag_obs ?? "-";
                var nomePaciente = c.pagante ?? "-";

                totalGeral += c.valor;

                gfx.DrawString(c.data.ToString("dd/MM/yyyy"), fontNormal, XBrushes.Black, new XPoint(50, y));
                gfx.DrawString(obs.Length > 18 ? obs.Substring(0, 18) : obs, fontNormal, XBrushes.Black, new XPoint(120, y));
                gfx.DrawString(nomePaciente.Length > 12 ? nomePaciente.Substring(0, 12) : nomePaciente, fontNormal, XBrushes.Black, new XPoint(280, y));
                gfx.DrawString(pago, fontNormal, XBrushes.Black, new XPoint(390, y));
                gfx.DrawString(nf, fontNormal, XBrushes.Black, new XPoint(440, y));
                gfx.DrawString($"R$ {c.valor:F2}", fontNormal, XBrushes.Black, new XPoint(480, y));

                y += 15;
            }

            gfx.DrawLine(XPens.Black, 50, y + 5, 570, y + 5);
            y += 15;
            gfx.DrawString($"Total de registros: {caixaList.Count}", fontNormal, XBrushes.Black, new XPoint(50, y));
            y += 15;
            gfx.DrawString($"TOTAL GERAL: R$ {totalGeral:F2}", fontBold, XBrushes.Black, new XPoint(380, y));

            using var stream = new MemoryStream();
            document.Save(stream);
            return File(stream.ToArray(), "application/pdf", $"caixa_{dataIni:yyyyMMdd}_{dataFim:yyyyMMdd}.pdf");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR RelatorioCaixa] {ex.Message}");
            return StatusCode(500, new { msg = "Erro ao gerar relatório", error = ex.Message });
        }
    }
}
