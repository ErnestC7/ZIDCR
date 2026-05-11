class CitizenId {
  final String uci;
  final String firstName;
  final String lastName;
  final String dateOfBirth;
  final String digitalGreenCardSignature;

  CitizenId({
    required this.uci,
    required this.firstName,
    required this.lastName,
    required this.dateOfBirth,
    required this.digitalGreenCardSignature,
  });

  // Convert to JSON for storage
  Map<String, dynamic> toJson() {
    return {
      'uci': uci,
      'firstName': firstName,
      'lastName': lastName,
      'dateOfBirth': dateOfBirth,
      'digitalGreenCardSignature': digitalGreenCardSignature,
    };
  }

  // Generate payload for QR Code
  String toQrPayload() {
    // In production, this might be a JWT or a specific verifiable presentation format
    return "$uci:$firstName:$lastName:$dateOfBirth:$digitalGreenCardSignature";
  }
}
