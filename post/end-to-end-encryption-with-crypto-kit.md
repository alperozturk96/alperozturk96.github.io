As technology becomes more integrated into our daily lives, the importance of data security is inevitable. Every day, we share files, store information in the cloud, and sometimes handle highly sensitive data. It's unthinkable for any modern product to store or transmit this data without proper encryption.

In this post, I will provide a high-level overview of end-to-end encryption using Apple's  [CryptoKit](<https://developer.apple.com/documentation/cryptokit>)  .

# Use Case

Imagine User 1 wants to send a message to User 2 over the internet an insecure channel. A third party (User 3) might intercept or tamper with the message in transit. Our goal is to prevent User 3 from reading or modifying this communication.

# Implementation

To implement end-to-end encryption, we need both Diffie-Hellman key agreement keys (for securely deriving a shared secret) and signing keys (to verify message authenticity). While Diffie-Hellman ensures that the message content is encrypted and decrypted only by the intended parties, signing keys confirm that the message was not altered and truly came from the sender.

## User

```swift

struct User {
    let id: UUID
    let name: String
    let surname: String

    // Diffie-Hellman keys
    let privateKey: Curve25519.KeyAgreement.PrivateKey
    var publicKey: Curve25519.KeyAgreement.PublicKey {
        privateKey.publicKey
    }

    // Signing keys
    let signingPrivateKey: Curve25519.Signing.PrivateKey
    var signingPublicKey: Curve25519.Signing.PublicKey {
        signingPrivateKey.publicKey
    }

    let messageHistory: [Message]
}

```

## Message

The `Message` struct includes the message text, its timestamp, and an optional digital signature. The `dataToSign()` method encodes only the core message fields (excluding the signature) to ensure consistent signing and verification.

```swift

struct Message: Codable {
    let text: String
    let date: Date

    // This field is not part of the data to be signed
    let signature: Data?

    // A separate struct to represent the data that should be signed
    private struct SignableMessageData: Codable {
        let text: String
        let date: Date
    }

    func dataToSign() throws -> Data {
        let signableData = SignableMessageData(text: text, date: date)
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(signableData)
    }
}

```

## Encrypt & Sign Message

The sender signs the message using their private signing key, ensuring authenticity. Then, using the Diffie-Hellman key agreement, the sender derives a shared symmetric key from their private key and the recipient's public key. This symmetric key is used to encrypt the signed message. The result can be transmitted securely over an untrusted network.

## Why Can’t the Attacker Decrypt?

Imagine User 3 is a malicious attacker intercepting the communication between User 1 and User 2. Even if User 3 sees the entire key exchange, including the values being transmitted across the network, they still cannot decrypt the actual message. Why? Because of a fundamental mathematical principle.

## Discrete Logarithm Problem

To explain this clearly, I will use small numbers for demonstration purposes:

**Step 1:**  
 User 1 and User 2 agree on public value: a prime number `p`. Let’s say `p = 7`. In a real-world scenario, this prime number and other numbers would be large.

**Step 2:**  
 They also agree on a public generator `g`. Let’s pick `g = 3`.

**Step 3:**  
 User 1 picks a private number `a = 4` and computes `A = 3⁴ mod 7`.

**Step 4:**  
 User 2 picks a private number `b = 5` and computes `B = 3⁵ mod 7`.

**Step 5:**  
 User 1 sends `A` to User 2, and User 2 sends `B` to User 1. Now, User 3 sees `p = 7`, `g = 3`, `result of A`, and `result of B`, but does not know `a` or `b`.

**Step 6:**  
 User 1 computes the shared secret: `K = B⁴ mod 7` (where 4 is User 1's private key).

**Step 7:**  
 User 2 computes the same shared secret: `K = A⁵ mod 7` (where 5 is User 2's private key).

Now both users share the same secret key `K` without ever sending it directly. Even though User 3 knows `g`, `p`, `A`, and `B`, they cannot calculate `K` without solving for `a` or `b`. This is known as the **Discrete Logarithm Problem**, and for large numbers, it is computationally hard to solve.

The actual cryptographic implementation uses very large prime numbers and elliptic curve math (like Curve25519), making it practically impossible for any attacker to compute the shared key.

Here’s the Swift implementation of this secure exchange:

## Salt & Shared Info Creation

This function guarantees that both sender and recipient compute the same salt value, which is then used during key derivation with HKDF. If needed, additional protocol-specific metadata can also be added to the `sharedInfo` parameter to further scope the derived key.

When deriving a symmetric key using the shared secret from Diffie-Hellman key exchange, it’s important to include a salt and shared info to ensure that the derived key is unique and secure. In our implementation, we generate a deterministic salt using the raw representations of both users' public keys.

By sorting and concatenating these keys, we ensure the same salt is derived regardless of which user initiates the exchange. This prevents mismatches in key derivation and adds an additional layer of uniqueness to the key.

```swift

func createSharedSalt(_ senderPublicKey: Curve25519.KeyAgreement.PublicKey,
                      _ recipientPublicKey: Curve25519.KeyAgreement.PublicKey) -> Data {
    let local = senderPublicKey.rawRepresentation
    let remote = recipientPublicKey.rawRepresentation

    let (first, second) = local.lexicographicallyPrecedes(remote) ? (local, remote) : (remote, local)
    return first + second
}

```

```swift

func encryptAndSignMessage(from sender: User,
                           to recipientPublicKey: Curve25519.KeyAgreement.PublicKey,
                           messageText: String) throws -> Data? {
    // Create the message
    let message = Message(text: messageText, date: Date(), signature: nil)
    let messageData = try message.dataToSign()

    // Sign the message
    let signature = try sender.signingPrivateKey.signature(for: messageData)
    let signedMessage = Message(text: message.text, date: message.date, signature: signature)

    // Create shared salt and shared info
    let salt = createSharedSalt(sender.publicKey, recipientPublicKey)
    guard let sharedInfo = "com.example.cryptokit".data(using: .utf8) else {
        throw CryptoError.sharedInfoCreation
    }

    // Derive shared secret
    let sharedSecret = try sender.privateKey.sharedSecretFromKeyAgreement(with: recipientPublicKey)
    let symmetricKey = sharedSecret.hkdfDerivedSymmetricKey(
        using: SHA256.self,
        salt: salt,
        sharedInfo: sharedInfo,
        outputByteCount: 32
    )

    // Encrypt
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    let signedMessageData = try encoder.encode(signedMessage)

    return try AES.GCM.seal(signedMessageData, using: symmetricKey).combined
}

```

## Decrypt & Verify Message

The recipient uses their private key and the sender’s public key to derive the same shared secret key through Diffie-Hellman. Then, they decrypt the message and verify the signature using the sender’s public signing key to ensure the message’s authenticity and integrity.

```swift

func decryptAndVerifyMessage(from senderPublicKey: Curve25519.KeyAgreement.PublicKey,
                              senderSigningKey: Curve25519.Signing.PublicKey,
                              to recipient: User,
                              encryptedData: Data) throws -> Message {
    // Create shared salt and shared info
    let salt = createSharedSalt(recipient.publicKey, senderPublicKey)
    guard let sharedInfo = "com.example.cryptokit".data(using: .utf8) else {
        throw CryptoError.sharedInfoCreation
    }

    // Derive shared secret
    let sharedSecret = try recipient.privateKey.sharedSecretFromKeyAgreement(with: senderPublicKey)
    let symmetricKey = sharedSecret.hkdfDerivedSymmetricKey(
        using: SHA256.self,
        salt: salt,
        sharedInfo: sharedInfo,
        outputByteCount: 32
    )

    // Decrypt
    let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)
    let decryptedData = try AES.GCM.open(sealedBox, using: symmetricKey)

    // Decode
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    let message = try decoder.decode(Message.self, from: decryptedData)

    // Verify Signature
    let signedData = try message.dataToSign()
    guard let signature = message.signature else {
        throw CryptoError.missingSignature
    }

    if senderSigningKey.isValidSignature(signature, for: signedData) {
        return message
    } else {
        throw CryptoError.invalidSignature
    }
}

```

## Test

The following code demonstrates the complete flow: User 1 sends an encrypted and signed message to User 2. Then, User 2 decrypts the message and verifies its authenticity.

In a real-world scenario, these users could be on separate devices communicating over the internet, and their cryptographic keys should be securely stored.

```swift

func test() throws {
    let user1 = createUser(name: "User", surname: "1")
    let user2 = createUser(name: "User", surname: "2")

    // User 1 encrypts and signs a message for User 2
    guard let encrypted = try encryptAndSignMessage(
        from: user1,
        to: user2.publicKey,
        messageText: "SOME_IMPORTANT_SECRET_MESSAGE"
    ) else {
        throw CryptoError.unexpectedEncryption
    }

    print("Encrypted data: " + encrypted.base64EncodedString())

    // User 2 decrypts and verifies
    let decrypted = try decryptAndVerifyMessage(
        from: user1.publicKey,
        senderSigningKey: user1.signingPublicKey,
        to: user2,
        encryptedData: encrypted
    )

    print("Decrypted data:  \(decrypted.text) at \(decrypted.date)")
}

```

## Output

```swift

Encrypted data: VbX7fLL7J/kAuKpw7WHbId4xo0HubD2BA4u5wVy0nvEF729tH8tvn0jnsxGh/zhh0cSIW2umkd0hXWSMY2Wvo83OuEXV9dHVq8vqjpKd
                        8/VE15zNKBpn48fPpHPF/6nnv9apwfFl3cfYeu7ODZoeX+0SJ4B8+786XK4PzDorXjZ+wYt6PB29q0ixwYAMSsnlPNEJ82TE
                        mstN43dJ0zWc9ArgM5TU2cr1ledpuukKZT8QEZefw75ZIhU7K7iebJLQS634MbFwORkf

Decrypted data:  SOME_IMPORTANT_SECRET_MESSAGE at 2025-07-19 16:14:53 +0000

```

# Conclusion

In this post, we implemented end-to-end encryption using Apple's `CryptoKit`. With Diffie-Hellman key agreement, we ensured that only the intended sender and recipient can derive the encryption key. With digital signatures, we verified the authenticity and integrity of the messages.

While this example was written in Swift, the same principles apply to other programming languages and platforms.
