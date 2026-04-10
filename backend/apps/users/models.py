from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('doctor', 'Médecin'),
        ('admin', 'Administrateur'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


class DoctorProfile(models.Model):
    SPECIALTY_CHOICES = [
        ('cardiologie', 'Cardiologie'),
        ('dentiste', 'Dentiste'),
        ('pediatrie', 'Pédiatrie'),
        ('generaliste', 'Médecin Généraliste'),
        ('dermatologie', 'Dermatologie'),
        ('ophtalmologie', 'Ophtalmologie'),
        ('neurologie', 'Neurologie'),
        ('orthopédie', 'Orthopédie'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialty = models.CharField(max_length=50, choices=SPECIALTY_CHOICES)
    license_number = models.CharField(max_length=50, unique=True)
    hospital = models.CharField(max_length=100, blank=True)
    consultation_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    bio = models.TextField(blank=True)
    available_from = models.TimeField(default='08:00')
    available_to = models.TimeField(default='18:00')

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} - {self.specialty}"


class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    blood_type = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)
    medical_history = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"Patient: {self.user.get_full_name()}"