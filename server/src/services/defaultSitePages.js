export const DEFAULT_SITE_PAGES = [
  {
    slug: 'help-center',
    title: 'Help Center',
    content: `Welcome to the LearnHub Help Center. Find answers to common questions about courses, payments, certificates, and your account.

## Getting started
Create a free account, browse courses, and enroll to start learning. Your progress is saved automatically so you can continue where you left off.

## Courses and learning
- Open **My Learning** from your dashboard to see enrolled courses.
- Use the course player to watch lessons, take notes, and complete quizzes.
- Certificates are issued when you finish all lessons and pass the final quiz.

## Payments and refunds
Course purchases are processed securely. If you have a billing issue, contact us from the Contact page with your order details.

## Instructor applications
Visit **Become Instructor** to submit your application. Our team reviews applications and notifies you in the dashboard when approved.

## Still need help?
Go to the Contact page and send us a message. We typically respond within 1–2 business days.`,
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    content: `Last updated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}

By using LearnHub, you agree to these Terms of Service. Please read them carefully.

## Using LearnHub
You must provide accurate account information and keep your login credentials secure. You may not share your account or use the platform for unlawful purposes.

## Courses and content
Course materials are owned by their instructors or LearnHub. Enrolling grants you a personal, non-transferable license to access content for learning purposes only.

## Payments
Paid courses require full payment before access is granted. Prices and offers may change. Taxes may apply based on your location.

## Instructor content
Instructors are responsible for the accuracy and legality of the content they publish. LearnHub may remove content that violates these terms or applicable law.

## Account termination
We may suspend or terminate accounts that violate these terms, abuse the platform, or engage in fraudulent activity.

## Changes
We may update these terms from time to time. Continued use of LearnHub after changes means you accept the updated terms.

## Contact
Questions about these terms? Reach us through the Contact page.`,
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `Last updated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}

LearnHub respects your privacy. This policy explains what information we collect and how we use it.

## Information we collect
- Account details such as name, email, and profile information.
- Learning activity including enrollments, progress, quiz results, and certificates.
- Payment-related data processed by our payment partners (we do not store full card details).
- Messages you send through contact forms or in-app messaging.

## How we use information
We use your data to provide the platform, process enrollments, improve courses, send important account notifications, and respond to support requests.

## Sharing
We do not sell your personal information. We may share data with trusted service providers (hosting, payments, email) only as needed to operate LearnHub.

## Cookies
We use cookies and similar technologies to keep you signed in and remember preferences such as theme settings.

## Data security
We apply reasonable technical and organizational measures to protect your information. No online service can guarantee absolute security.

## Your choices
You can update profile details from your dashboard. To request account deletion or data access, contact us through the Contact page.

## Children
LearnHub is not directed at children under 13. We do not knowingly collect personal information from children.

## Contact
For privacy questions, contact us through the Contact page.`,
  },
];

export async function ensureDefaultSitePages(SitePage) {
  for (const page of DEFAULT_SITE_PAGES) {
    await SitePage.findOneAndUpdate(
      { slug: page.slug },
      { $setOnInsert: page },
      { upsert: true }
    );
  }
}
