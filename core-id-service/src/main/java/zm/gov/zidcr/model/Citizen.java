package zm.gov.zidcr.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "citizens")
public class Citizen {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "uci", updatable = false, nullable = false)
    private UUID uci;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "gender", nullable = false, length = 10)
    private String gender;

    @Column(name = "nationality", length = 50)
    private String nationality = "Zambian";

    @Column(name = "national_registration_card_number", unique = true, length = 20)
    private String nationalRegistrationCardNumber;

    @Column(name = "biometric_hash", columnDefinition = "TEXT")
    private String biometricHash;

    @Column(name = "signature_data", columnDefinition = "TEXT")
    private String signatureData;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getUci() { return uci; }
    public void setUci(UUID uci) { this.uci = uci; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getNationalRegistrationCardNumber() { return nationalRegistrationCardNumber; }
    public void setNationalRegistrationCardNumber(String nationalRegistrationCardNumber) { this.nationalRegistrationCardNumber = nationalRegistrationCardNumber; }

    public String getBiometricHash() { return biometricHash; }
    public void setBiometricHash(String biometricHash) { this.biometricHash = biometricHash; }

    public String getSignatureData() { return signatureData; }
    public void setSignatureData(String signatureData) { this.signatureData = signatureData; }
}
