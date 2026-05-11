package zm.gov.zidcr.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.gov.zidcr.dto.EnrollmentRequest;
import zm.gov.zidcr.dto.EnrollmentResponse;
import zm.gov.zidcr.model.Citizen;
import zm.gov.zidcr.repository.CitizenRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Service
public class CitizenEnrollmentService {

    private final CitizenRepository citizenRepository;
    private final SigningService signingService;

    @Autowired
    public CitizenEnrollmentService(CitizenRepository citizenRepository, SigningService signingService) {
        this.citizenRepository = citizenRepository;
        this.signingService = signingService;
    }

    /**
     * Generates a Cryptographic Unique Citizen Identifier (UCI).
     * It uses SHA-256 to hash the combination of immutable demographics + biometric hash.
     * The resulting hash is truncated and formatted into a UUID.
     */
    private UUID generateCryptographicUCI(EnrollmentRequest req) {
        try {
            String rawData = req.getFirstName() + "|" + 
                             req.getLastName() + "|" + 
                             req.getDateOfBirth().toString() + "|" + 
                             req.getBiometricHash();
                             
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawData.getBytes(StandardCharsets.UTF_8));
            
            // Construct a UUID from the first 16 bytes of the SHA-256 hash
            return UUID.nameUUIDFromBytes(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    @Transactional
    public EnrollmentResponse enrollCitizen(EnrollmentRequest request) {
        Citizen citizen = new Citizen();
        
        // 1. Generate Cryptographic Identifier
        UUID cryptographicUci = generateCryptographicUCI(request);
        citizen.setUci(cryptographicUci);
        
        citizen.setFirstName(request.getFirstName());
        citizen.setLastName(request.getLastName());
        citizen.setDateOfBirth(request.getDateOfBirth());
        citizen.setGender(request.getGender());
        citizen.setBiometricHash(request.getBiometricHash());
        
        // Generate pseudo NRC
        String generatedNrc = String.format("%06d/%02d/1", 
            (int)(Math.random() * 999999), 
            (int)(Math.random() * 99)
        );
        citizen.setNationalRegistrationCardNumber(generatedNrc);

        // 2. Sign the identity data (Digital Green Card Verifiable Credential)
        String signature = signingService.signCitizenData(citizen);
        citizen.setSignatureData(signature);

        // 3. Save to database
        citizenRepository.save(citizen);

        return new EnrollmentResponse(citizen.getUci(), signature);
    }
}
