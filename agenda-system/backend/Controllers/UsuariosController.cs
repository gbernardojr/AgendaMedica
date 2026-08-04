using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsuariosController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var usuarios = await _db.Usuarios.ToListAsync();
        return Ok(usuarios.Select(u => new
        {
            id = u.usu_id,
            username = u.usu_username,
            nome = u.usu_nome,
            admin = u.usu_admin == "S",
            perm_agenda = u.perm_agenda,
            perm_clientes = u.perm_clientes,
            perm_profissionais = u.perm_profissionais,
            perm_procedimentos = u.perm_procedimentos
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Usuario usuario)
    {
        var maxId = await _db.Usuarios.MaxAsync(u => (int?)u.usu_id) ?? 0;
        usuario.usu_id = maxId + 1;
        usuario.usu_senha = BCrypt.Net.BCrypt.HashPassword(usuario.usu_senha);
        usuario.usu_admin = usuario.admin ? "S" : "N";
        usuario.perm_agenda = usuario.perm_agenda ?? true;
        usuario.perm_clientes = usuario.perm_clientes ?? true;
        usuario.perm_profissionais = usuario.perm_profissionais ?? false;
        usuario.perm_procedimentos = usuario.perm_procedimentos ?? false;

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
        return Ok(new { id = usuario.usu_id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Usuario usuario)
    {
        var existing = await _db.Usuarios.FindAsync(id);
        if (existing == null) return NotFound();

        if (!string.IsNullOrEmpty(usuario.usu_nome))
            existing.usu_nome = usuario.usu_nome;
        if (!string.IsNullOrEmpty(usuario.usu_senha))
            existing.usu_senha = BCrypt.Net.BCrypt.HashPassword(usuario.usu_senha);
        
        existing.usu_admin = usuario.admin ? "S" : "N";
        existing.perm_agenda = usuario.perm_agenda;
        existing.perm_clientes = usuario.perm_clientes;
        existing.perm_profissionais = usuario.perm_profissionais;
        existing.perm_procedimentos = usuario.perm_procedimentos;

        await _db.SaveChangesAsync();
        return Ok(new { msg = "ok" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();
        if (usuario.usu_username == "admin")
            return BadRequest(new { msg = "Não é possível excluir o administrador" });

        _db.Usuarios.Remove(usuario);
        await _db.SaveChangesAsync();
        return Ok(new { msg = "ok" });
    }
}
