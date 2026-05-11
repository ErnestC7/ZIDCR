package zm.gov.zidcr.dto;

import java.util.UUID;

public class EnrollmentResponse {
    private UUID uci;
    private String digitalGreenCard;

    public EnrollmentResponse(UUID uci, String digitalGreenCard) {
        this.uci = uci;
        this.digitalGreenCard = digitalGreenCard;
    }

    // Getters and Setters
    public UUID getUci() { return uci; }
    public void setUci(UUID uci) { this.uci = uci; }

    public String getDigitalGreenCard() { return digitalGreenCard; }
    public void setDigitalGreenCard(String digitalGreenCard) { this.digitalGreenCard = digitalGreenCard; }
}
