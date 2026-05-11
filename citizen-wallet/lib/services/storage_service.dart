import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/citizen_id.dart';

class StorageService {
  final _secureStorage = const FlutterSecureStorage();

  Future<void> saveCitizenId(CitizenId id) async {
    // In a real app, serialize the JSON
    await _secureStorage.write(key: 'uci', value: id.uci);
    await _secureStorage.write(key: 'firstName', value: id.firstName);
    await _secureStorage.write(key: 'lastName', value: id.lastName);
    await _secureStorage.write(key: 'dob', value: id.dateOfBirth);
    await _secureStorage.write(key: 'signature', value: id.digitalGreenCardSignature);
  }

  Future<CitizenId?> getCitizenId() async {
    final uci = await _secureStorage.read(key: 'uci');
    if (uci == null) return null; // No ID saved yet

    return CitizenId(
      uci: uci,
      firstName: (await _secureStorage.read(key: 'firstName')) ?? '',
      lastName: (await _secureStorage.read(key: 'lastName')) ?? '',
      dateOfBirth: (await _secureStorage.read(key: 'dob')) ?? '',
      digitalGreenCardSignature: (await _secureStorage.read(key: 'signature')) ?? '',
    );
  }
}
