using System.ComponentModel.DataAnnotations;
using KontaktyAplikacja.Models;
using Microsoft.EntityFrameworkCore;

namespace KontaktyAplikacja.Data
{

    public class ContactDto
    {

        [Required(ErrorMessage = "Imię jest wymagane")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Nazwisko jest wymagane")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "Email jest wymagany")]
        [EmailAddress(ErrorMessage = "Nieprawidłowy format email")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Kategoria jest wymagana")]
        public string Category { get; set; } 

        public string? Subcategory { get; set; } 

        [Required(ErrorMessage = "Numer telefonu jest wymagany")]
        [Phone(ErrorMessage = "Nieprawidłowy format numeru telefonu")]
        public string Phone { get; set; }

        [Required(ErrorMessage = "Data urodzenia jest wymagana")]
        [DataType(DataType.Date, ErrorMessage = "Nieprawidłowy format daty")]
        public DateTime BirthDate { get; set; }
    }
    public class ContactsDto
    {
        public int Id { get; set; }

        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Phone { get; set; }

        [Required]
        public string Category { get; set; }

        public string Subcategory { get; set; }

        [Required]
        public DateTime BirthDate { get; set; }
    }
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Contact> Contacts { get; set; }
    }
}