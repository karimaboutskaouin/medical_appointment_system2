# Système de Prise de Rendez-vous Médicaux

Application web de gestion de rendez-vous médicaux avec deux interfaces distinctes (patient & médecin), développée dans le cadre du module **Génie Logiciel** — FSSM, Université Cadi Ayyad.

## Stack technique

| Couche | Technologie |
|--------|------------|
| Backend | Django 6.0, Django REST Framework 3.17 |
| Auth | JWT (SimpleJWT) |
| Base de données | SQLite3 (dev) / PostgreSQL (prod) |
| Frontend | React 18, React Router 6, Axios |
| QR Code | qrcode.react, html5-qrcode |
| Conteneurisation | Docker, Docker Compose |
| CI/CD | GitHub Actions |

## Architecture

Trois apps Django organisées en services REST :

- **`users`** — Inscription, connexion, profils (patient/médecin), gestion des rôles
- **`appointments`** — CRUD rendez-vous, cycle de vie (pending → confirmed → completed / cancelled), statistiques
- **`notifications`** — Alertes internes liées aux rendez-vous

Communication frontend ↔ backend via API REST avec intercepteur JWT (refresh automatique).

## Fonctionnalités

### Patient
- Inscription et connexion sécurisée
- Recherche de médecins par spécialité
- Prise, consultation et annulation de rendez-vous
- Dossier médical complet (signes vitaux, historique, documents)
- Génération et téléchargement d'un QR code médical
- Notifications

### Médecin
- Dashboard avec statistiques (rendez-vous du jour, taux d'annulation, etc.)
- Calendrier et planning
- Confirmation/annulation/complétion des rendez-vous
- Scan du QR code patient pour accéder au dossier médical
- Liste des patients

### Administrateur
- Interface Django Admin pour la gestion de tous les modèles

## Modèles de données

- `User` (AbstractUser personnalisé avec rôle)
- `DoctorProfile` (spécialité, numéro de licence, honoraires, disponibilités)
- `PatientProfile` (groupe sanguin, allergies, antécédents, urgence)
- `Appointment` (patient, médecin, date, heure, statut, diagnostic)
- `Notification` (type, titre, message, lu/non lu)
- `VitalSigns` (tension, rythme cardiaque, poids, taille, IMC)
- `MedicalDocument` (ordonnance, analyse, rapport, imagerie)

## API — Endpoints principaux

### `/api/users/`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register/` | Inscription (patient ou médecin) |
| POST | `/login/` | Connexion → JWT tokens |
| GET/PATCH | `/profile/` | Profil utilisateur |
| GET | `/doctors/` | Liste des médecins (filtre `?specialty=`) |
| GET | `/patients/<id>/` | Dossier médical patient (médecin only) |

### `/api/appointments/`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | `/` | Lister / Créer un rendez-vous |
| GET/PUT/PATCH/DELETE | `/<id>/` | Détail / Modification / Annulation |
| GET | `/today/` | Rendez-vous du jour |
| GET | `/stats/` | Statistiques dashboard |

### `/api/notifications/`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste des notifications |
| POST | `/<id>/read/` | Marquer comme lu |

## Démarrage rapide

```bash
docker-compose up --build
```

- Frontend : `http://localhost:3000`
- Backend : `http://localhost:8000`
- Admin : `http://localhost:8000/admin`

Sans Docker :

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm start
```

## Tests

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

## Auteurs

**Encadré par :**
- Pr. KALLOUBI Fahd

**Réalisé par :**
- BOUTSKAOUIN Karima
- Beddach Houda
- Mohamed AZEROUAL

Année universitaire 2025/2026.
