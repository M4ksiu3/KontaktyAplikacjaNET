using KontaktyAplikacja.Data;
using KontaktyAplikacja.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KontaktyAplikacja.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactsController : ControllerBase
    {
        private readonly AppDbContext _context;
        //pobranie bazy danych
        public ContactsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetContacts() // pobranie kontaktow do kafelkow bez szczegolow
        {
            try
            {
                var contacts = await _context.Contacts
                    .Select(c => new
                    {
                        Id = c.Id,
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        Phone = c.Phone
                    })
                    .ToListAsync();

                return Ok(new { data = contacts });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Wyst¹pi³ b³¹d serwera", error = ex.Message });
            }
        }
        [HttpDelete("{id}")] // usuwanie kontaktu na podstawie ID z frontu
        public async Task<IActionResult> DeleteContact(int id)
        {
            var contact = await _context.Contacts.FindAsync(id);
            if (contact == null)
            {
                return NotFound();
            }

            _context.Contacts.Remove(contact);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpPut("{id}")] // Update kontaktow na podstawie ID
        public async Task<IActionResult> UpdateContact(int id, [FromBody] ContactsDto contactsDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != contactsDto.Id)
            {
                return BadRequest("ID w œcie¿ce nie zgadza siê z ID w obiekcie.");
            }

            var existingContact = await _context.Contacts.FindAsync(id);
            if (existingContact == null) // przypisanie wartosci do obiektu do bazy danych
            {
                return NotFound("Kontakt o podanym ID nie istnieje.");
            }
            existingContact.FirstName = contactsDto.FirstName;
            existingContact.LastName = contactsDto.LastName;
            existingContact.Email = contactsDto.Email;
            existingContact.Phone = contactsDto.Phone;
            existingContact.Category = contactsDto.Category;
            existingContact.Subcategory = contactsDto.Subcategory;
            existingContact.BirthDate = contactsDto.BirthDate;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Contacts.Any(e => e.Id == id))
                {
                    return NotFound("Kontakt o podanym ID nie istnieje.");
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateContact([FromBody] ContactsDto contactDto) // stworzenie kontaktu na podstawie email hasla
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                    // email ma byc unikalny
            if (await _context.Contacts.AnyAsync(x => x.Email == contactDto.Email))
                return BadRequest("U¿ytkownik o podanym emailu ju¿ istnieje");
            // walidacja kategorii
            if (contactDto.Category == "s³u¿bowy" && string.IsNullOrEmpty(contactDto.Subcategory))
                return BadRequest("Podkategoria jest wymagana dla kategorii 's³u¿bowy'");

            var contact = new Contact
            {
                FirstName = contactDto.FirstName,
                LastName = contactDto.LastName,
                Email = contactDto.Email,
                PasswordHash = null, //haslo na null 
                Phone = contactDto.Phone,
                Category = contactDto.Category,
                Subcategory = contactDto.Subcategory,
                BirthDate = contactDto.BirthDate.ToUniversalTime() //pg potrzebuje w formacie UTC 
            };

            _context.Contacts.Add(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kontakt zosta³ dodany pomyœlnie" });
        }
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetContact(int id) // pobranie kontaktu z bazy danych na podstawie ID
        {
            try
            {
                var contact = await _context.Contacts
                    .Where(c => c.Id == id)
                    .Select(c => new
                    {
                        Id = c.Id,
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        Email = c.Email,
                        Category = c.Category,
                        Subcategory = c.Subcategory,
                        Phone = c.Phone,
                        BirthDate = c.BirthDate.ToString("yyyy-MM-dd")
                    })
                    .FirstOrDefaultAsync();

                if (contact == null) return NotFound(new { message = "Contact not found" });

                return Ok(new { data = contact });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Server error", error = ex.Message });


            }
        }

    }
}