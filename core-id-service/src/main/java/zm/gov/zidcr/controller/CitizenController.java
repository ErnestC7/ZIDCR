package zm.gov.zidcr.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import zm.gov.zidcr.dto.EnrollmentRequest;
import zm.gov.zidcr.dto.EnrollmentResponse;
import zm.gov.zidcr.service.CitizenEnrollmentService;

@RestController
@RequestMapping("/api/v1/citizens")
public class CitizenController {

    private final CitizenEnrollmentService enrollmentService;

    @Autowired
    public CitizenController(CitizenEnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @PostMapping("/enroll")
    public ResponseEntity<EnrollmentResponse> enrollCitizen(@RequestBody EnrollmentRequest request) {
        try {
            EnrollmentResponse response = enrollmentService.enrollCitizen(request);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            // In a production app, use proper exception handling/advice
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
