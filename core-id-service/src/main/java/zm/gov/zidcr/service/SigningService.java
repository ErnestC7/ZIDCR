package zm.gov.zidcr.service;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;
import zm.gov.zidcr.model.Citizen;

import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;

@Service
public class SigningService {

    private final KeyPair keyPair;

    public SigningService() {
        Security.addProvider(new BouncyCastleProvider());
        try {
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("ECDSA", "BC");
            ECGenParameterSpec ecSpec = new ECGenParameterSpec("secp256r1"); // P-256
            keyGen.initialize(ecSpec, new SecureRandom());
            this.keyPair = keyGen.generateKeyPair();
            // In a production scenario, this key pair would be retrieved from the HSM
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize cryptographic provider", e);
        }
    }

    public String signCitizenData(Citizen citizen) {
        try {
            String dataToSign = String.format("%s:%s:%s:%s",
                    citizen.getUci().toString(),
                    citizen.getFirstName(),
                    citizen.getLastName(),
                    citizen.getDateOfBirth().toString()
            );

            Signature ecdsaSign = Signature.getInstance("SHA256withECDSA", "BC");
            ecdsaSign.initSign(keyPair.getPrivate());
            ecdsaSign.update(dataToSign.getBytes("UTF-8"));
            byte[] signature = ecdsaSign.sign();

            return Base64.getEncoder().encodeToString(signature);
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign citizen data", e);
        }
    }
}
