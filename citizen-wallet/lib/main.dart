import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const CitizenWalletApp());
}

class CitizenWalletApp extends StatelessWidget {
  const CitizenWalletApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ZIDCR Wallet',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
