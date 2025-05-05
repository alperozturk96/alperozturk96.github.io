export const professionalProjects = [
  {
    name: 'Nextcloud',
    description: `
    <ul style="margin-top:0.7em; margin-bottom:1.2em; padding-left:1.3em; font-size:1em; color:#bdbdbd;">
      <li>Developed and maintained Files & Notes mobile apps reaching 1M+ active users.</li>
      <li>Implemented end-to-end encryption using Bouncy Castle and androidx.security, ensuring secure data transfer, certificate-signature verification.</li>
      <li>Successfully implemented background tasks such as multi-file, folder synchronization, downloads, and uploads using WorkManager.</li>
      <li>Applied the MVVM design pattern and modern Android best practices to maintain a clean, scalable, and testable codebase</li>
      <li>Eliminated anti-patterns in the project by adopting modern Android development practices</li>
      <li>Reduced memory usage by 20% and improved performance by up to 50% through efficient use of Kotlin Coroutines</li>
      <li>Refactored and migrated a legacy Java codebase to Kotlin, improving maintainability and eliminating technical debt</li>
    </ul>`,
    tech: ['Kotlin', 'Java', 'XML', 'Jetpack Compose'],
    screenshots: [],
    type: 'professional',
    links: [
      { label: 'Android', url: 'https://play.google.com/store/apps/details?id=com.nextcloud.client&hl=en_US' },
      { label: 'iOS', url: 'https://apps.apple.com/us/app/nextcloud/id1125420102' }
    ]
  },
  {
    name: 'LipaWallet',
    description: `<ul style="margin-top:0.7em; margin-bottom:1.2em; padding-left:1.3em; font-size:1em; color:#bdbdbd;">
      <li>Developed a Bitcoin Lightning wallet with native SwiftUI for iOS and Jetpack Compose for Android</li>
      <li>Solved complex data transfer issues by integrating an internally developed Rust library into native Android and iOS apps using platform-specific bindings and an event-driven architecture</li>
      <li>Built an efficient, memory-leak-free, and high-performance networking architecture by leveraging the latest approaches with the Apollo GraphQL client separately for Android and iOS</li>
      <li>Maximized user security by implementing biometric authentication: Touch ID and Face ID on iOS, and biometric authentication on Android</li>
      <li>Designed architecture for background data processing for both Android and iOS platforms</li>
      <li>Created a modular architecture for Android and iOS separately to eliminate code duplication and improve maintainability and reusability used Swift Package Manager (SPM) for iOS and JitPack for Android</li>
      <li>Automated development and release processes using Fastlane</li>
    </ul>`,
    tech: ['Swift', 'SwiftUI', 'Kotlin', 'Jetpack Compose'],
    screenshots: [],
    type: 'professional',
    links: [
      { label: 'iOS', url: 'https://apps.apple.com/ch/app/lipa-wallet/id1658329527' },
      { label: 'Android', url: 'https://play.google.com/store/apps/details?id=com.getlipa.wallet&amp%3Bhl=en' }
    ]
  },
  {
    name: 'Emlakjet',
    description: 'Emlakjet is a real estate app for searching, posting, and managing property listings. Users can find apartments, houses, offices, and land for sale or rent, and contact real estate agencies directly. The app offers advanced search, saved searches, favorite listings, and market analysis tools.',
    tech: ['Java', 'XML', 'Objective-C', 'UIKit'],
    screenshots: [],
    type: 'professional',
    links: [
      { label: 'Android', url: 'https://play.google.com/store/apps/details?id=com.emlakjet.kurumsal.sekizbit' },
      { label: 'iOS', url: 'https://apps.apple.com/us/app/emlakjet-emlak-ara-i-lan-ver/id1194656334' }
    ]
  },
  {
    name: 'DentalBulut',
    description: 'Designed for dental clinics, serving as a patient tracking and clinic management software. It allows dentists to manage patient information and clinic operations efficiently from mobile devices',
    tech: ['Java', 'XML', 'Swift', 'UIKit'],
    screenshots: [],
    type: 'professional',
    links: [
      { label: 'Android', url: 'https://play.google.com/store/apps/details?id=com.dentalbulut.android&hl=en_US' },
      { label: 'iOS', url: 'https://apps.apple.com/us/app/dentalbulut/id687279571' }
    ]
  }
];
