using System;
using System.ComponentModel.DataAnnotations;

namespace KontaktyAplikacja.Models
{
    public class Contact
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string? PasswordHash { get; set; } 

        [Required]
        public string Category { get; set; } 

        public string? Subcategory { get; set; }

        [Phone]
        public string Phone { get; set; }

        [DataType(DataType.Date)]
        public DateTime BirthDate { get; set; }
    }
}