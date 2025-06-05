import {ProjectType} from "./project.type.js";
import {ProjectLabel} from "./project.label.js";

export const professionalProjects = [
  {
    name: 'Nextcloud',
    description: `
    <ul style="margin-top:0.7em; margin-bottom:1.2em; padding-left:1.3em; font-size:1em; color:#bdbdbd;">
      <li>Developed and maintained <strong>Files</strong> and <strong>Notes</strong> mobile apps with over <strong>1M+ active users</strong></li>
      <li>Implemented <strong>end-to-end encryption</strong> using <strong>Bouncy Castle</strong> and <strong>androidx.security</strong>, ensuring secure data transfer and certificate-signature verification</li>
      <li>Integrated <strong>open-source AI solutions</strong> into mobile applications to enhance the user experience with features like headline generation, document summarization, and on-device question answering.</li>
      <li>Built and optimized background tasks (multi-file & folder sync, downloads, uploads) using <strong>WorkManager</strong></li>
      <li>Applied the <strong>MVVM</strong> design pattern and modern <strong>Android</strong> best practices for scalable and testable code</li>
      <li>Eliminated antipatterns by refactoring toward modern <strong>Android</strong> development practices</li>
      <li>Improved app performance by up to <strong>50%</strong> and reduced memory usage by <strong>20%</strong> through efficient use of <strong>Kotlin Coroutines</strong></li>
      <li>Migrated a large legacy <strong>Java</strong> codebase to <strong>Kotlin</strong>, reducing technical debt and improving maintainability</li>
    </ul>`,
    tech: ['Kotlin', 'Java', 'XML', 'Jetpack Compose'],
    screenshots: [],
    type: ProjectType.Professional,
    links: [
      { label: ProjectLabel.Android, url: 'https://play.google.com/store/apps/details?id=com.nextcloud.client&hl=en_US' },
      { label: ProjectLabel.iOS, url: 'https://apps.apple.com/us/app/nextcloud/id1125420102' }
    ]
  },
  {
    name: 'LipaWallet',
    description: `
    <ul style="margin-top:0.7em; margin-bottom:1.2em; padding-left:1.3em; font-size:1em; color:#bdbdbd;">
      <li>Developed a <strong>Bitcoin Lightning</strong> wallet with native <strong>SwiftUI</strong> for iOS and <strong>Jetpack Compose</strong> for Android</li>
      <li>Integrated an internally developed <strong>Rust</strong> library into Android and iOS using platform-specific bindings and an <strong>event-driven architecture</strong></li>
      <li>Built a high-performance, memory-leak-free networking layer with the <strong>Apollo GraphQL</strong> client for both platforms</li>
      <li>Implemented biometric security using <strong>Touch ID</strong>, <strong>Face ID</strong> (iOS), and <strong>BiometricPrompt</strong> (Android)</li>
      <li>Designed efficient background data processing for real-time transaction and wallet state updates</li>
      <li>Created a modular architecture with <strong>Swift Package Manager (SPM)</strong> for iOS and <strong>JitPack</strong> for Android, reducing code duplication</li>
      <li>Automated development and release workflows using <strong>Fastlane</strong></li>
    </ul>`,
    tech: ['Swift', 'SwiftUI', 'Kotlin', 'Jetpack Compose'],
    screenshots: [],
    type: ProjectType.Professional,
    links: [
      { label: ProjectLabel.Android, url: 'https://play.google.com/store/apps/details?id=com.getlipa.wallet&amp%3Bhl=en' },
      { label: ProjectLabel.iOS, url: 'https://apps.apple.com/ch/app/lipa-wallet/id1658329527' }
    ]
  },
  {
    name: 'Scan360',
    description: `
    <ul style="margin-top:0.7em; margin-bottom:1.2em; padding-left:1.3em; font-size:1em; color:#bdbdbd;">
      <li>Developed a full-featured document scanner using <strong>UIKit</strong> and <strong>VisionKit</strong> for iOS, supporting high-quality scanning and automatic document detection</li>
      <li>Integrated PDF generation, document editing (crop, rotate, filter), and multi-page scan support</li>
      <li>Implemented features for signing, sharing, and exporting documents in various formats (PDF, JPEG)</li>
      <li>Built a smooth user experience with real-time image processing and seamless camera integration</li>
      <li>Integrated <strong>StoreKit</strong> to manage in-app purchases and trials for premium features such as unlimited scans, advanced editing tools</li>
    </ul>`,
    tech: ['Swift', 'UIKit'],
    screenshots: [],
    type: ProjectType.Professional,
    links: [
      { label: ProjectLabel.iOS, url: 'https://apps.apple.com/us/app/scan360-pdf-scanner-sign/id1589134970' }
    ]
  },
  {
    name: 'Emlakjet',
    description: `
    <ul style="margin-top:0.7em; margin-bottom:1.2em; padding-left:1.3em; font-size:1em; color:#bdbdbd;">
      <li>Developed a full-featured real estate app for listing, searching, and managing properties using <strong>Java</strong> and <strong>Objective-C</strong></li>
      <li>Implemented features such as <strong>advanced search filters</strong>, saved searches, favorite listings, and direct contact with real estate agents</li>
      <li>Built a user-friendly experience with market analysis tools and real-time listing updates</li>
      <li>Maintained codebase across Android and iOS using <strong>XML</strong> for Android UI and <strong>UIKit</strong> for iOS</li>
    </ul>`,
    tech: ['Java', 'XML', 'Objective-C', 'UIKit'],
    screenshots: [],
    type: ProjectType.Professional,
    links: [
      { label: ProjectLabel.Android, url: 'https://play.google.com/store/apps/details?id=com.emlakjet.kurumsal.sekizbit' },
      { label: ProjectLabel.iOS, url: 'https://apps.apple.com/us/app/emlakjet-emlak-ara-i-lan-ver/id1194656334' }
    ]
  },
  {
    name: 'DentalBulut',
    description: `
    <ul style="margin-top:0.7em; margin-bottom:1.2em; padding-left:1.3em; font-size:1em; color:#bdbdbd;">
      <li>Developed a mobile clinic management solution for dentists, supporting <strong>patient tracking</strong>, appointment scheduling, and clinic operations</li>
      <li>Built native mobile apps using <strong>Java</strong> and <strong>Swift</strong>, tailored for Android and iOS respectively</li>
      <li>Implemented user-friendly UI for mobile workflows using <strong>XML</strong> and <strong>UIKit</strong></li>
      <li>Optimized app performance for use in offline scenarios and low-bandwidth environments</li>
    </ul>`,
    tech: ['Java', 'XML', 'Swift', 'UIKit'],
    screenshots: [],
    type: ProjectType.Professional,
    links: [
      { label: ProjectLabel.Android, url: 'https://play.google.com/store/apps/details?id=com.dentalbulut.android&hl=en_US' },
      { label: ProjectLabel.iOS, url: 'https://apps.apple.com/us/app/dentalbulut/id687279571' }
    ]
  }
];
