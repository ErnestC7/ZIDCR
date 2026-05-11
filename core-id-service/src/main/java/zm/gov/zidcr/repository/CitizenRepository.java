package zm.gov.zidcr.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import zm.gov.zidcr.model.Citizen;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CitizenRepository extends JpaRepository<Citizen, UUID> {
    Optional<Citizen> findByNationalRegistrationCardNumber(String nrc);
}
