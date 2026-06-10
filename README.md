# 🏥 GL_Projet - Application de Prise de Rendez-vous Médicaux

## 📌 Description
Cette application permet aux patients de prendre des rendez-vous en ligne avec des médecins et aux médecins de gérer leur planning efficacement.

---

## 🎯 Objectif
Développer une plateforme moderne permettant :

- Aux patients de réserver facilement des rendez-vous
- Aux médecins de gérer leur agenda
- Une communication fluide entre les utilisateurs

---

## 🚀 Fonctionnalités principales

### 🔐 Authentification
- Inscription (patients / médecins)
- Connexion sécurisée
- Gestion des rôles

---

### 📅 Gestion des rendez-vous
- Prise de rendez-vous en ligne
- Modification des rendez-vous
- Annulation des rendez-vous
- Consultation de l’historique

---

### 📊 Tableau de bord

**Dashboard patient :**
- Voir les rendez-vous
- Prendre un rendez-vous

**Dashboard médecin :**
- Gestion du planning
- Liste des patients

---

### 🔔 Notifications
- Notifications internes
- Notifications par email

---

## 🧱 Architecture
Architecture basée sur les microservices :

- 🔑 Auth Service (Authentification)
- 📅 Appointment Service (Rendez-vous)
- 🔔 Notification Service (Notifications)

Communication via API REST.

---

## 🛠️ Technologies utilisées

### 🔙 Backend
-Python
-django rest framework

### 🎨 Frontend
- Interface conçue avec Figma
- (React recommandé pour l’implémentation)

### ⚙️ DevOps
- Docker
- Docker Compose
- GitHub Actions (CI/CD)
- Pytest (tests unitaires)
- SonarQube (qualité du code)

---

## 🐳 Conteneurisation avec Docker
Chaque microservice est conteneurisé :

```bash
docker-compose up --build
