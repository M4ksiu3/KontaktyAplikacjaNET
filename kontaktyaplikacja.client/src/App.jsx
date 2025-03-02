import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import './App.css'; // style
import { login, register } from './auth';


//kazdy kafelek z kontaktem 
const ContactTile = ({ contact, onDelete, onEdit, isLoggedIn }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [detailedContact, setDetailedContact] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const tileRef = useRef(null);

    const handleClick = async () => { // odpowiedz na klikniecie w kafelek
        if (!isExpanded && !detailedContact) {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:5000/api/contacts/${contact.id}`);
                const data = await response.json();
                setDetailedContact(data.data);
            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setIsLoading(false);
            }
        }

        if (!isExpanded) {// sprawdzenie czy jest powiekszony czy nie aby zmienic wyglad miedzy nimi 
            setIsExpanded(true);
        } else {
            const tile = tileRef.current;
            tile.style.transform = "scaleY(1)";
            setTimeout(() => {
                setIsExpanded(false);
                tile.style.transform = "";
                tile.style.opacity = "";
            }, 400);
        }
    };

    return (
        <div
            ref={tileRef}
            className={`contact-tile ${isExpanded ? 'expanded' : ''}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            style={{
                transition: isExpanded
                    ? "all 0.4s cubic-bezier(1, 0, 0.2, 1)"
                    : "all 0.4s cubic-bezier(1, 0, 0.2, 1) 0.3s"
            }}
        >
            <div className="basic-info">
                <h3>{contact.firstName} {contact.lastName}</h3>
                <p>Nr. Tel {contact.phone}</p>
            </div>

            <div className="detailed-info">
                {isLoading ? (
                    <div className="loading">Ładowanie...</div>
                ) : (
                    detailedContact && ( // wieksza ilosc informacji po rozciagneiciu 
                        <>
                            <p>Adres email: {detailedContact.email}</p>
                            <p>Kategoria: {detailedContact.category}</p>
                            {detailedContact.subcategory && (
                                <p>Podkategoria kontaktu: {detailedContact.subcategory}</p>
                            )}
                                <p>Data urodzenia: {detailedContact.birthDate}</p>
                                {isLoggedIn && (
                                    <div className="contact-actions">
                                        <button // przyciski od edycji i usuwania danego kontaktu

                                            className="edit-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(contact.id);
                                            }}
                                        >
                                            Edytuj
                                        </button>
                                        <button
                                            className="delete-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(contact.id);
                                            }}
                                        >
                                            Usuń
                                        </button>
                                    </div>
                            )}
                        </>
                    )
                )}
            </div>
        </div>
    );
};
// Strona glowna po odpaleniu apki
const HomePage = ({ isLoggedIn }) => {
    const [contacts, setContacts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => { // pobranie kontaktow 
        try {
            const response = await fetch('http://localhost:5000/api/contacts');
            const data = await response.json();
            if (data && data.data) {
                setContacts(data.data);
            } else {
                console.error('Odpowiedź z API nie zawiera danych'); // brak kontaktow
            }
        } catch (error) {
            console.error('Błąd podczas pobierania kontaktów:', error);
        }
    };

    const handleDelete = async (id) => { // obsluga usuwania zapytanie API do usuniecia z bazy danych
        try {
            const response = await fetch(`http://localhost:5000/api/contacts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Nie udało się usunąć kontaktu');
            }

            alert('Kontakt został usunięty pomyślnie!');
            fetchContacts(); // odsiwzenie listy kontaktow po usunieciu
        } catch (error) {
            alert(error.message);
        }
    };

    const handleEdit = (id) => {
        navigate(`/edit-contact/${id}`);
    };

    return (
        <div className="home-container">
            <h1>Aplikacja do obsługi listy kontaktów</h1>
            {isLoggedIn && ( // dodanie nowych kontaktow jak jest zalogowany uzytkownik
                <Link to="/add-contact" className="add-contact-button"> 
                    Dodaj nowy kontakt
                </Link>            // przekazywanie prop do komponentow 
            )}

            <div className="contacts-grid"> 
                {contacts.map((contact) => (
                    <ContactTile
                        key={contact.Id}
                        contact={contact}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        isLoggedIn={isLoggedIn}
                    />
                ))}
            </div>
        </div>
    );
};
//Strona z logowaniem
const LoginPage = () => {
    const [email, setEmail] = useState(''); //wczytanie stanow 
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const navigate = useNavigate();

    const validatePassword = (password) => { //walidacja hasla, min 6 znakow potem duza litera potem znak specjalny w IF
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return 'Hasło musi mieć co najmniej 6 znaków.';
        }
        if (!hasUpperCase) {
            return 'Hasło musi zawierać co najmniej jedną dużą literę.';
        }
        if (!hasSpecialChar) {
            return 'Hasło musi zawierać co najmniej jeden znak specjalny.';
        }
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // strona z rejestracja uzytwkonika
        if (isRegistering) {
            const error = validatePassword(password);
            if (error) {
                setPasswordError(error);
                return;
            }
        }

        try {
            if (isRegistering) {
                await register({ firstName, lastName, email, password });
                alert('Rejestracja udana! Zaloguj się');
                setIsRegistering(false);
            } else {
                const { token } = await login(email, password);
                localStorage.setItem('token', token);
                navigate('/');
            }
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2>{isRegistering ? 'Zarejestruj się' : 'Zaloguj się'}</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    {isRegistering && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Imię</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Wpisz swoje imię"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nazwisko</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Wpisz swoje nazwisko"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Wpisz adres email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Hasło</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (isRegistering) {
                                    setPasswordError(validatePassword(e.target.value));
                                }
                            }}
                            placeholder="Wpisz hasło"
                            required
                        />
                        {passwordError && <p className="error-message">{passwordError}</p>}
                    </div>

                    <button type="submit" className="login-submit">
                        {isRegistering ? 'Zarejestruj' : 'Zaloguj'}
                    </button>

                    <button
                        type="button"
                        className="toggle-mode"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setPasswordError('');
                        }}
                    >
                        {isRegistering
                            ? 'Masz już konto? Zaloguj się'
                            : 'Nie masz konta? Zarejestruj się'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Obsluga APP calej aplikacji
const App = () => {
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            setUserEmail(decodedToken.email);
            setIsLoggedIn(true);
        }
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserEmail('');
    };

    return (
        <div className="app-container">
            {location.pathname !== '/login' && (
                <header className="app-header">
                    <nav>
                        {isLoggedIn ? (
                            <>
                                <span className="user-email">{userEmail}</span>
                                <button onClick={handleLogout} className="logout-button">
                                    Wyloguj
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="login-button">
                                Zaloguj się
                            </Link>
                        )}
                    </nav>
                </header>
            )}

            <main>
                <Routes>
                    <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/add-contact" element={<AddContactPage />} />
                    <Route path="/edit-contact/:id" element={<EditContactPage />} />
                </Routes>
            </main>
        </div>
    );
};
// obsluga dodawania nowego kontaktu
const AddContactPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [category, setCategory] = useState('prywatny'); // domyslna prywatny
    const [subcategory, setSubcategory] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [subcategoryOptions, setSubcategoryOptions] = useState([]); // opcja pod kategoriii
    const navigate = useNavigate();

    // Aktualizacja widocznosci podkategorii w zaleznosci od kategorii
    useEffect(() => {
        if (category === 'służbowy') {
            setSubcategoryOptions(['szef', 'klient', 'pracownik']); // przyklady 
        } else if (category === 'inny') {
            setSubcategoryOptions([]); // wpisywany recznie
        } else {
            setSubcategoryOptions([]); // brak widocznosci
        }
    }, [category]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newContact = {
            firstName,
            lastName,
            email,
            phone,
            category,
            subcategory: category === 'prywatny' ? null : subcategory, // jezeli prywatny to null 
            birthDate,
            passwordHash: null // haslo na null
        };

        try {
            const response = await fetch('http://localhost:5000/api/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newContact)
            });

            if (!response.ok) {
                throw new Error('Nie udało się dodać kontaktu');
            }

            alert('Kontakt został dodany pomyślnie');
            navigate('/');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="add-contact-page">
            <h2>Dodaj nowy kontakt</h2>
            <form className="add-contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Imię</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Nazwisko</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Telefon</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Kategoria</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="prywatny">Prywatny</option>
                        <option value="służbowy">Służbowy</option>
                        <option value="inny">Inny</option>
                    </select>
                </div>
                {category === 'służbowy' && (
                    <div className="form-group">
                        <label>Podkategoria</label>
                        <select
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            required
                        >
                            <option value="">Wybierz podkategorię</option>
                            {subcategoryOptions.map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {category === 'inny' && (
                    <div className="form-group">
                        <label>Podkategoria</label>
                        <input
                            type="text"
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            required
                        />
                    </div>
                )}
                <div className="form-group">
                    <label>Data urodzenia</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="submit-button">
                    Dodaj kontakt
                </button>
            </form>
        </div>
    );
};
// edycja kontaktu
const EditContactPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [category, setCategory] = useState('prywatny');
    const [subcategory, setSubcategory] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [subcategoryOptions, setSubcategoryOptions] = useState([]);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        //kontakt do edycji 
        const fetchContact = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/contacts/${id}`);
                const data = await response.json();
                const contact = data.data;
                setFirstName(contact.firstName);
                setLastName(contact.lastName);
                setEmail(contact.email);
                setPhone(contact.phone);
                setCategory(contact.category);
                setSubcategory(contact.subcategory || '');
                setBirthDate(contact.birthDate);
            } catch (error) {
                console.error('Błąd podczas pobierania kontaktu:', error);
            }
        };

        fetchContact();
    }, [id]);

    useEffect(() => { // obsluga miedzy kategoriami
        if (category === 'służbowy') {
            setSubcategoryOptions(['szef', 'klient', 'pracownik']);
        } else if (category === 'inny') {
            setSubcategoryOptions([]);
        } else {
            setSubcategoryOptions([]);
        }
    }, [category]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Obiekt PascalCode i edycja
        const updatedContact = {
            Id: parseInt(id), 
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            Phone: phone,
            Category: category,
            Subcategory: category === 'prywatny' ? null : subcategory,
            BirthDate: new Date(birthDate).toISOString() // parsowanie daty
        };

        try {
            const response = await fetch(`http://localhost:5000/api/contacts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedContact) // Wpisanie danych do bazy danych
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Nie udało się zaktualizować kontaktu');
            }

            alert('Kontakt został zaktualizowany pomyślnie!');
            navigate('/');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="edit-contact-page">
            <h2>Edytuj kontakt</h2>
            <form className="edit-contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Imię</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Nazwisko</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Telefon</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Kategoria</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="prywatny">Prywatny</option>
                        <option value="służbowy">Służbowy</option>
                        <option value="inny">Inny</option>
                    </select>
                </div>
                {category === 'służbowy' && (
                    <div className="form-group">
                        <label>Podkategoria</label>
                        <select
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            required
                        >
                            <option value="">Wybierz podkategorię</option>
                            {subcategoryOptions.map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {category === 'inny' && (
                    <div className="form-group">
                        <label>Podkategoria</label>
                        <input
                            type="text"
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            required
                        />
                    </div>
                )}
                <div className="form-group">
                    <label>Data urodzenia</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="submit-button">
                    Zapisz zmiany
                </button>
            </form>
        </div>
    );
};
//AppWrapper 
const AppWrapper = () => (
    <Router>
        <App />
    </Router>
);

export default AppWrapper;