import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/citizen_id.dart';

class QrDisplayScreen extends StatelessWidget {
  final CitizenId citizenId;

  const QrDisplayScreen({super.key, required this.citizenId});

  @override
  Widget build(BuildContext context) {
    // This is the signed payload that an offline verifier app will scan.
    // It contains the signature which can be verified against the Govt Public Key.
    final qrData = citizenId.toQrPayload();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Offline Verification QR'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Show this QR code to the verifying officer or bank agent.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 40),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 10,
                      spreadRadius: 2,
                    )
                  ],
                ),
                child: QrImageView(
                  data: qrData,
                  version: QrVersions.auto,
                  size: 250.0,
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 40),
              const Text(
                'This QR code contains your cryptographically signed identity verifiable offline.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
