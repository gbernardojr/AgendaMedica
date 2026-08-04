using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProcedimentosController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProcedimentosController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var procedimentos = await _db.Procedimentos.ToListAsync();
        return Ok(procedimentos.Select(p => new { id = p.proc_id, nome = p.proc_nome, valor = p.proc_valor ?? 0 }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProcedimentoDto data)
    {
        try
        {
            int nextId = (_db.Procedimentos.Max(p => (int?)p.proc_id) ?? 0) + 1;
            var procedimento = new Procedimento
            {
                proc_id = nextId,
                proc_nome = data.nome ?? "",
                proc_valor = data.valor
            };
            _db.Procedimentos.Add(procedimento);
            await _db.SaveChangesAsync();
            return Ok(new { id = procedimento.proc_id });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { msg = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProcedimentoDto data)
    {
        var existing = await _db.Procedimentos.FindAsync(id);
        if (existing == null) return NotFound();

        existing.proc_nome = data.nome ?? "";
        existing.proc_valor = data.valor;
        await _db.SaveChangesAsync();
        return Ok(new { msg = "ok" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var procedimento = await _db.Procedimentos.FindAsync(id);
        if (procedimento == null) return NotFound();

        _db.Procedimentos.Remove(procedimento);
        await _db.SaveChangesAsync();
        return Ok(new { msg = "ok" });
    }
}

public class ProcedimentoDto
{
    public string? nome { get; set; }
    public decimal? valor { get; set; }
}
