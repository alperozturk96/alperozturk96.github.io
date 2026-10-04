You may have a hard time deciding where to save data produced by your application.

We have many options: UserDefaults, Core Data, FileManager, and others. Sometimes you don't know which one to choose. Or you may ask yourself:

`How can I save a file so the user can see it in the Files app?`

I had the same confusion, so I want to make this simpler.

# Where and how?

UserDefaults is designed for small pieces of app settings and configuration. If you need to store a Boolean, a small string, or a few simple values, UserDefaults is usually a good choice. If you are trying to use it as a general-purpose storage system for your application's data, you are probably using the wrong tool.

Core Data is designed for applications that need structured persistent data, relationships, change tracking, and other database-like features. It is a good choice when your application's data has a more complex model than a few files.

But sometimes we don't need either of them. Sometimes we just need to save a file.

# FileManager

FileManager may look complicated because it provides many APIs for working with the filesystem. But you can simplify/limit it, our needs are usually quite simple.

Our app may need to store cache data to improve performance. Or the app may need to store private application data.
Or the app may need to store a document that the user should be able to access from the Files app. All of these can be handled with files.

The important thing is understanding where we should put those files.
On iOS, applications are sandboxed, so we cannot simply write to any directory on the device. Instead, iOS provides specific directories with different purposes.

Once we understand those directories, FileManager becomes much easier to work with.

# Storage Location

Let's define our storage locations as URLs so we can choose the location according to our needs.
I like to wrap these locations in an enum. This removes some of the confusion from the rest of the application.
The key point is for user visible location you must enable the mentioned keys in Info.plist.

```swift
enum StorageLocation {
    /// Stored in the Application Support directory.
    /// Use this for essential app data that should be hidden from the user.
    case appData
    
    /// Stored in the Caches directory.
    /// Use this for temporary data that can be safely discarded.
    case cache
    
    /// Stored in the Documents directory under a specific folder.
    /// Use this for user-generated content that should be accessible via the iOS Files app.
    /// - Note: To make this directory visible to the user in the Files app, you must add the following keys to your `Info.plist`:
    ///   - `<key>UIFileSharingEnabled</key> <true/>`
    ///   - `<key>LSSupportsOpeningDocumentsInPlace</key> <true/>`
    case userVisible(directory: String)
    
    case custom(URL)
    
    var url: URL {
        switch self {
        case .appData:
            return URL.applicationSupportDirectory
        case .cache:
            return URL.cachesDirectory
        case .userVisible(let directory):
            return URL.documentsDirectory.appendingPathComponent(directory, isDirectory: true)
        case .custom(let url):
            return url
        }
    }
}
```

# Storage Service Protocol

Now that we have the locations, we can define what our storage service should be able to do.
A protocol is useful here because it clearly defines the capabilities of the storage service and makes the implementation easier to test or replace.
The functions use generics so we can save and load different Codable types without creating separate methods for every model.


```swift
protocol StorageServiceProtocol {
    func save<T: Encodable>(_ value: T, as name: String, to location: StorageLocation) throws
    func load<T: Decodable>(_ type: T.Type, from name: String, at location: StorageLocation) throws -> T
    func delete(_ name: String, at location: StorageLocation) throws
    func exists(_ name: String, at location: StorageLocation) -> Bool
}
```

Now the rest of the application doesn't need to know how files are created, encoded, or located.
It only needs to know: `save, load, delete, exists`

# Storage Service

I use a shared instance here because this service is stateless apart from its dependencies.
I also inject FileManager, JSONEncoder, and JSONDecoder. This isn't necessary for a small application, but it makes the service easier to customize and test.

```swift
final class StorageService: StorageServiceProtocol {
    static let shared = StorageService()
    
    private let fileManager: FileManager
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    
    init(
        fileManager: FileManager = .default,
        encoder: JSONEncoder = JSONEncoder(),
        decoder: JSONDecoder = JSONDecoder()
    ) {
        self.fileManager = fileManager
        self.encoder = encoder
        self.decoder = decoder
    }
    
    func save<T: Encodable>(_ value: T, as name: String, to location: StorageLocation) throws {
        let directoryURL = location.url
        try fileManager.createDirectory(at: directoryURL, withIntermediateDirectories: true)
        
        let fileURL = directoryURL.appendingPathComponent(name)
        let data = try encoder.encode(value)
        
        try data.write(to: fileURL, options: [.atomic, .completeFileProtection])
        print("✅ Successfully saved: \(name) to \(fileURL.path)")
    }
    
    func load<T: Decodable>(_ type: T.Type, from name: String, at location: StorageLocation) throws -> T {
        let fileURL = location.url.appendingPathComponent(name)
        let data = try Data(contentsOf: fileURL)
        let decoded = try decoder.decode(T.self, from: data)
        print("✅ Successfully loaded: \(name) from \(fileURL.path)")
        return decoded
    }
    
    func delete(_ name: String, at location: StorageLocation) throws {
        let fileURL = location.url.appendingPathComponent(name)
        try fileManager.removeItem(at: fileURL)
        print("✅ Successfully deleted: \(name) from \(fileURL.path)")
    }
    
    func exists(_ name: String, at location: StorageLocation) -> Bool {
        let fileURL = location.url.appendingPathComponent(name)
        let fileExists = fileManager.fileExists(atPath: fileURL.path)
        if fileExists {
            print("✅ File exists: \(name) at \(fileURL.path)")
        }
        return fileExists
    }
}
```

The save method creates the directory if it doesn't already exist, encodes the value as JSON, and writes it to the selected location.

I'm also using .atomic and .completeFileProtection.
.atomic writes the file in a safer way by writing to a temporary location first and then replacing the destination.
.completeFileProtection applies Apple's complete file protection to the file. This is useful when the data should not be accessible while the device is locked.
You can learn more about the available writing options in Apple's NSData.WritingOptions documentation.

The methods can throw errors, so the caller should handle failures appropriately. For example, a UI might want to show an error message instead of simply ignoring a failed save.

# Usage

The caller doesn't need to know anything about FileManager or the actual directory URLs.It simply chooses the appropriate storage location.

```swift
try StorageService.shared.save(imageCache, as: imageCache.key, to: .cache)

try StorageService.shared.save(configuration, as: appConfiguration, to: .appData)

try StorageService.shared.save(
        monthlyReport,
        as: "monthly_report.pdf",
        to: .userVisible(
            directory: Date().formatted(
                .dateTime
                    .month(.wide)
                    .year()
            )
        )
    )
```
