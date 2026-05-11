import 'dart:convert';
import 'package:nfc_manager/nfc_manager.dart';
import '../models/citizen_id.dart';

class NfcService {
  
  /// Starts an NFC session to transmit the Verifiable Credential to a Verifier device
  Future<void> startNfcTransmission(CitizenId citizenId, Function(String) onStatus) async {
    try {
      bool isAvailable = await NfcManager.instance.isAvailable();
      if (!isAvailable) {
        onStatus("NFC is not available on this device.");
        return;
      }

      onStatus("Hold phone near the verifier terminal (NFC Active)");

      // Start Session for Host Card Emulation or NDEF push (depending on platform)
      await NfcManager.instance.startSession(onDiscovered: (NfcTag tag) async {
        // In a real scenario, this involves NDEF message writing to a passive terminal 
        // or bidirectional ISO-DEP communication.
        // Here we simulate writing the signed payload to the Verifier's tag buffer.
        
        Ndef? ndef = Ndef.from(tag);
        if (ndef == null || !ndef.isWritable) {
          onStatus("Tag is not writable.");
          NfcManager.instance.stopSession(errorMessage: 'Tag not writable');
          return;
        }

        final payload = citizenId.toQrPayload();
        NdefMessage message = NdefMessage([
          NdefRecord.createText(payload),
        ]);

        try {
          await ndef.write(message);
          onStatus("Identity transmitted successfully via NFC!");
          NfcManager.instance.stopSession();
        } catch (e) {
          onStatus("Failed to transmit via NFC: $e");
          NfcManager.instance.stopSession(errorMessage: e.toString());
        }
      });
    } catch (e) {
      onStatus("Error starting NFC: $e");
    }
  }

  void stopNfc() {
    NfcManager.instance.stopSession();
  }
}
