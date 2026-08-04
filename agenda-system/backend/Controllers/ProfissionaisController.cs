using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfissionaisController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfissionaisController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var profissionais = await _db.Profissionais.ToListAsync();
        return Ok(profissionais.Select(p => new { crm = p.med_crm, nome = p.med_nome }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Profissional profissional)
    {
        if (await _db.Profissionais.AnyAsync(p => p.med_crm == profissional.med_crm))
            return BadRequest(new { msg = "Profissional já existe" });

        _db.Profissionais.Add(profissional);
        await _db.SaveChangesAsync();
        return Ok(new { msg = "ok" });
    }

    [HttpPut("{crm}")]
    public async Task<IActionResult> Update(string crm, [FromBody] Profissional profissional)
    {
        var existing = await _db.Profissionais.FindAsync(crm);
        if (existing == null) return NotFound();

        existing.med_nome = profissional.med_nome;
        await _db.SaveChangesAsync();
        return Ok(new { msg = "ok" });
    }

    [HttpDelete("{crm}")]
    public async Task<IActionResult> Delete(string crm)
    {
        var profissional = await _db.Profissionais.FindAsync(crm);
        if (profissional == null) return NotFound();

        _db.Profissionais.Remove(profissional);
        await _db.SaveChangesAsync();
        return Ok(new { msg = "ok" });
    }
}
