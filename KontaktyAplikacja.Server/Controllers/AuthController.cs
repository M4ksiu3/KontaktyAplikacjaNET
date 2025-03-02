using System;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net; 
using KontaktyAplikacja.Models;
using KontaktyAplikacja.Data;

namespace KontaktyAplikacja.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("register")] // register aby mogl ktos sie zalogowac 4 ostatnie sa na podstawowej losowej wartosci
        public async Task<IActionResult> Register(RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (await _context.Contacts.AnyAsync(x => x.Email == registerDto.Email))
                return BadRequest("Użytkownik o podanym emailu już istnieje");

            var contact = new Contact
            {
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Email = registerDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Phone = "000-000-000", 
                Category = "prywatny", 
                Subcategory = null, 
                BirthDate = DateTime.UtcNow 
            };

            _context.Contacts.Add(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Rejestracja zakończona sukcesem" });
        }

        [HttpPost("login")] // API do logowania na podstawie ID wraz z ahshowaniem BCrypt 
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            var contact = await _context.Contacts
                .FirstOrDefaultAsync(x => x.Email == loginDto.Email);

            if (contact == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, contact.PasswordHash)) 
                return Unauthorized("Nieprawidłowy email lub hasło");

            var token = GenerateJwtToken(contact);

            return Ok(new
            {
                token,
                user = new
                {
                    contact.Id,
                    contact.Email,
                    contact.FirstName,
                    contact.LastName
                }
            });
        }

        private string GenerateJwtToken(Contact contact) // konfig JSON web token
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, contact.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, contact.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, contact.Id.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(3),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class RegisterDto // rejestracja 
    {
        [Required(ErrorMessage = "Imię jest wymagane")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Nazwisko jest wymagane")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "Email jest wymagany")]
        [EmailAddress(ErrorMessage = "Nieprawidłowy format email")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Hasło jest wymagane")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Hasło musi mieć co najmniej 6 znaków")]
        public string Password { get; set; }
    }

    public class LoginDto // logowanie
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }
}