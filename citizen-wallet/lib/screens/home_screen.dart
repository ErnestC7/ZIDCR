import 'package:flutter/material.dart';
import '../models/citizen_id.dart';
import '../services/storage_service.dart';
import '../services/nfc_service.dart';
import 'qr_display_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final StorageService _storageService = StorageService();
  final NfcService _nfcService = NfcService();
  CitizenId? _citizenId;
  bool _isLoading = true;
  String _nfcStatus = "";

  @override
  void initState() {
    super.initState();
    _loadId();
  }

  Future<void> _loadId() async {
    final id = await _storageService.getCitizenId();
    if (id == null) {
      // Mock loading an ID for demonstration if none exists
      final mockId = CitizenId(
        uci: "550e8400-e29b-41d4-a716-446655440000",
        firstName: "Chilufya",
        lastName: "Mulenga",
        dateOfBirth: "1985-10-24",
        digitalGreenCardSignature: "MEUCIQC...mock_signature...=",
      );
      await _storageService.saveCitizenId(mockId);
      setState(() {
        _citizenId = mockId;
        _isLoading = false;
      });
    } else {
      setState(() {
        _citizenId = id;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Digital Green Card'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Republic of Zambia', style: Theme.of(context).textTheme.titleLarge),
                    const Divider(),
                    const SizedBox(height: 10),
                    Text('Name: ${_citizenId!.firstName} ${_citizenId!.lastName}', style: const TextStyle(fontSize: 18)),
                    const SizedBox(height: 10),
                    Text('DOB: ${_citizenId!.dateOfBirth}', style: const TextStyle(fontSize: 18)),
                    const SizedBox(height: 10),
                    Text('UCI: ${_citizenId!.uci}', style: const TextStyle(fontSize: 14, color: Colors.grey)),
                  ],
                ),
              ),
            ),
            const Spacer(),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => QrDisplayScreen(citizenId: _citizenId!),
                  ),
                );
              },
              icon: const Icon(Icons.qr_code),
              label: const Text('Show QR for Verification'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                textStyle: const TextStyle(fontSize: 18),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton.icon(
              onPressed: () {
                setState(() => _nfcStatus = "Initializing NFC...");
                _nfcService.startNfcTransmission(_citizenId!, (status) {
                  setState(() => _nfcStatus = status);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(status)));
                });
              },
              icon: const Icon(Icons.nfc),
              label: const Text('Tap to Verify (NFC)'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                textStyle: const TextStyle(fontSize: 18),
                backgroundColor: Colors.blueAccent,
                foregroundColor: Colors.white,
              ),
            ),
            if (_nfcStatus.isNotEmpty) 
               Padding(
                 padding: const EdgeInsets.only(top: 8.0),
                 child: Text(_nfcStatus, textAlign: TextAlign.center, style: const TextStyle(color: Colors.blue)),
               )
          ],
        ),
      ),
    );
  }
}
