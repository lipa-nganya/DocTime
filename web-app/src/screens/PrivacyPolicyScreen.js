import React from 'react';
import ScreenWithHeader from '../components/ScreenWithHeader';
import './PrivacyPolicyScreen.css';

export default function PrivacyPolicyScreen() {
  return (
    <ScreenWithHeader title="Privacy Policy">
      <div className="privacy-screen">
        <div className="privacy-content">
          <h2>Privacy Policy</h2>
          <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h3>1. Introduction</h3>
            <p>
              Doc Time ("we," "us," or "our") is committed to protecting your privacy and the privacy of patient information in accordance with Kenyan data protection laws. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application ("App"). By using the App, you consent to the data practices described in this policy.
            </p>
            <p>
              This Privacy Policy applies to all users of the Doc Time App, including healthcare professionals, medical staff, and administrators operating in Kenya. We are committed to complying with applicable Kenyan data protection laws, including:
            </p>
            <ul>
              <li>The Data Protection Act, 2019 - Kenya's primary data protection legislation</li>
              <li>The Digital Health Act, 2023 - governing health data in digital formats</li>
              <li>The Health Act, 2017 - protecting patient confidentiality</li>
              <li>The Data Protection (General) Regulations, 2021 - detailed data processing requirements</li>
              <li>The Medical Practitioners and Dentists Act - professional confidentiality obligations</li>
            </ul>
            <p>
              We are registered with the Office of the Data Protection Commissioner (ODPC) as a data controller and processor, and we adhere to all requirements set forth by the ODPC.
            </p>
          </section>

          <section>
            <h3>2. Information We Collect</h3>
            <p>
              <strong>2.1 Account Information:</strong> When you create an account, we collect:
            </p>
            <ul>
              <li>Phone number (used as your unique identifier and for authentication)</li>
              <li>Personal identification number (PIN) - stored in encrypted form</li>
              <li>Prefix (e.g., Dr., Mr., Mrs.)</li>
              <li>Preferred name</li>
              <li>Professional role (Surgeon, Assistant Surgeon, Anaesthetist, etc.)</li>
              <li>Other role information if applicable</li>
            </ul>
            
            <p>
              <strong>2.2 Medical Case Information:</strong> As part of the App's functionality, you may enter:
            </p>
            <ul>
              <li>Patient names and identification numbers</li>
              <li>Patient ages and medical information</li>
              <li>Procedure details and dates</li>
              <li>Facility and payer information</li>
              <li>Payment and billing information</li>
              <li>Surgical team member information</li>
              <li>Case notes and additional medical information</li>
            </ul>
            
            <p>
              <strong>2.3 Usage Information:</strong> We automatically collect:
            </p>
            <ul>
              <li>Device information (device type, operating system, unique device identifiers)</li>
              <li>App usage data (features used, time spent, pages viewed)</li>
              <li>Log data (IP address, access times, error logs)</li>
              <li>Last login timestamps</li>
            </ul>
            
            <p>
              <strong>2.4 Communication Data:</strong> When you contact us:
            </p>
            <ul>
              <li>Support requests and communications</li>
              <li>Feedback and survey responses</li>
            </ul>
          </section>

          <section>
            <h3>3. How We Use Your Information</h3>
            <p>
              We use the collected information for the following purposes:
            </p>
            <ul>
              <li><strong>Service Provision:</strong> To provide, maintain, and improve the App's functionality, including case management, invoice generation, and reporting features</li>
              <li><strong>Authentication:</strong> To verify your identity and secure your account</li>
              <li><strong>Communication:</strong> To send you important updates, security alerts, and administrative messages</li>
              <li><strong>Referral Services:</strong> To facilitate case referrals between healthcare providers, including sending SMS notifications</li>
              <li><strong>Analytics:</strong> To analyze usage patterns, improve user experience, and develop new features</li>
              <li><strong>Compliance:</strong> To comply with legal obligations and respond to lawful requests from authorities</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and security threats</li>
              <li><strong>Support:</strong> To respond to your inquiries and provide customer support</li>
            </ul>
          </section>

          <section>
            <h3>4. Legal Basis for Processing</h3>
            <p>
              Under the Data Protection Act, 2019, we process your personal information based on the following legal grounds:
            </p>
            <ul>
              <li><strong>Consent:</strong> Where you have provided explicit, informed consent for specific processing activities, as required by Section 30 of the Data Protection Act, 2019</li>
              <li><strong>Contractual Necessity:</strong> To perform our contract with you and provide the App's services</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable Kenyan laws and regulations, including medical record retention requirements</li>
              <li><strong>Legitimate Interests:</strong> To improve our services, ensure security, and prevent fraud, where such interests do not override your fundamental rights and freedoms</li>
              <li><strong>Vital Interests:</strong> To protect the vital interests of data subjects or other persons</li>
            </ul>
            <p>
              For patient health information, which is classified as sensitive personal data under the Data Protection Act, 2019, we process data based on:
            </p>
            <ul>
              <li>Your role as a healthcare provider subject to professional confidentiality obligations (Section 31 of the Data Protection Act, 2019)</li>
              <li>Explicit consent obtained from patients before processing their health data, as required by the Digital Health Act, 2023</li>
              <li>Medical necessity for the provision of healthcare services</li>
            </ul>
            <p>
              You are responsible for obtaining explicit, informed consent from patients before entering their information into the App, in accordance with the Digital Health Act, 2023 and the Data Protection (General) Regulations, 2021.
            </p>
          </section>

          <section>
            <h3>5. Information Sharing and Disclosure</h3>
            <p>
              We do not sell, rent, or trade your personal information. We may share information in the following circumstances:
            </p>
            
            <p>
              <strong>5.1 Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf, including:
            </p>
            <ul>
              <li>Cloud hosting and data storage providers</li>
              <li>SMS service providers (for sending OTP codes and referral notifications)</li>
              <li>Analytics and monitoring services</li>
              <li>Payment processors (if applicable)</li>
            </ul>
            <p>
              These service providers are contractually obligated to protect your information and use it only for the purposes we specify.
            </p>
            
            <p>
              <strong>5.2 Case Referrals:</strong> When you refer a case to another healthcare provider, we share relevant case information with the referred provider to facilitate the referral process. This includes sending SMS notifications containing case details.
            </p>
            
            <p>
              <strong>5.3 Legal Requirements:</strong> We may disclose information if required by law, court order, or governmental regulation, or if we believe disclosure is necessary to:
            </p>
            <ul>
              <li>Comply with legal obligations</li>
              <li>Protect our rights, property, or safety</li>
              <li>Protect the rights, property, or safety of our users or others</li>
              <li>Prevent or investigate fraud or security issues</li>
            </ul>
            
            <p>
              <strong>5.4 Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity, subject to the same privacy protections.
            </p>
          </section>

          <section>
            <h3>6. Data Security</h3>
            <p>
              We implement comprehensive technical and organizational security measures to protect your information:
            </p>
            <ul>
              <li><strong>Encryption:</strong> Data is encrypted in transit using TLS/SSL protocols and at rest using industry-standard encryption algorithms</li>
              <li><strong>Authentication:</strong> Multi-factor authentication using phone number and PIN</li>
              <li><strong>Access Controls:</strong> Role-based access controls to limit data access to authorized personnel only</li>
              <li><strong>Regular Audits:</strong> Security audits and vulnerability assessments</li>
              <li><strong>Data Backup:</strong> Regular backups with secure storage</li>
              <li><strong>Employee Training:</strong> Staff training on data protection and privacy</li>
            </ul>
            <p>
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h3>7. Data Retention</h3>
            <p>
              We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Retained while your account is active and for a reasonable period after account closure for legal and regulatory compliance</li>
              <li><strong>Medical Case Data:</strong> Retained in accordance with applicable medical record retention laws, typically 7-10 years or as required by local regulations</li>
              <li><strong>Usage Data:</strong> Retained for analytics purposes, typically for 2-3 years</li>
              <li><strong>Log Data:</strong> Retained for security and troubleshooting purposes, typically for 90 days to 1 year</li>
            </ul>
            <p>
              Upon account deletion, we will delete or anonymize your personal information, subject to legal retention requirements for medical records.
            </p>
          </section>

          <section>
            <h3>8. Your Privacy Rights</h3>
            <p>
              Under the Data Protection Act, 2019, you have the following rights regarding your personal information:
            </p>
            <ul>
              <li><strong>Right to be Informed (Section 26):</strong> Right to be informed about the collection and use of your personal data</li>
              <li><strong>Right of Access (Section 26):</strong> Request a copy of the personal information we hold about you, including the source of the data and the logic involved in automated decision-making</li>
              <li><strong>Right to Rectification (Section 26):</strong> Request correction of inaccurate or incomplete information without undue delay</li>
              <li><strong>Right to Erasure (Section 26):</strong> Request deletion of your personal information, subject to legal retention requirements under the Health Act, 2017 and medical record retention laws</li>
              <li><strong>Right to Restrict Processing (Section 26):</strong> Request limitation of how we process your information in certain circumstances</li>
              <li><strong>Right to Data Portability (Section 26):</strong> Request transfer of your data to another service provider in a structured, commonly used format</li>
              <li><strong>Right to Object (Section 26):</strong> Object to processing of your information for direct marketing or legitimate interests</li>
              <li><strong>Right to Withdraw Consent (Section 30):</strong> Withdraw consent at any time where processing is based on consent, without affecting the lawfulness of processing before withdrawal</li>
              <li><strong>Right to Lodge a Complaint (Section 56):</strong> Lodge a complaint with the Office of the Data Protection Commissioner if you believe your rights have been violated</li>
            </ul>
            <p>
              To exercise these rights, please contact us through the Contact Us section in the App or at 0712674333. We will respond to your request within 21 days as required by the Data Protection Act, 2019, subject to verification of your identity.
            </p>
            <p>
              <strong>Note:</strong> Patient health information may be subject to additional legal requirements under the Health Act, 2017 and medical record retention laws, which may restrict access, modification, or deletion in certain circumstances.
            </p>
          </section>

          <section>
            <h3>9. Children's Privacy</h3>
            <p>
              The App is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child without parental consent, we will take steps to delete such information promptly.
            </p>
          </section>

          <section>
            <h3>10. International Data Transfers</h3>
            <p>
              Under the Data Protection Act, 2019, personal data may only be transferred outside Kenya if:
            </p>
            <ul>
              <li>The destination country has adequate data protection laws, or</li>
              <li>Appropriate safeguards are in place to protect the data, as approved by the Office of the Data Protection Commissioner</li>
            </ul>
            <p>
              If your information is transferred to and processed in countries other than Kenya, we ensure that appropriate safeguards are in place in accordance with Section 48 of the Data Protection Act, 2019, including:
            </p>
            <ul>
              <li>Standard contractual clauses approved by the Office of the Data Protection Commissioner</li>
              <li>Binding corporate rules for intra-group transfers</li>
              <li>Certification schemes recognized by the ODPC</li>
              <li>Regular security assessments of our data processing practices</li>
            </ul>
            <p>
              We will notify you of any international transfers and obtain your consent where required by law.
            </p>
          </section>

          <section>
            <h3>11. Cookies and Tracking Technologies</h3>
            <p>
              The App may use cookies and similar tracking technologies to enhance your experience. These technologies help us:
            </p>
            <ul>
              <li>Remember your preferences and settings</li>
              <li>Analyze App usage and performance</li>
              <li>Provide personalized features</li>
            </ul>
            <p>
              You can control cookie preferences through your device settings, though disabling cookies may affect App functionality.
            </p>
          </section>

          <section>
            <h3>12. Changes to This Privacy Policy</h3>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
            </p>
            <ul>
              <li>Updating the "Last updated" date at the top of this policy</li>
              <li>Posting a notice in the App</li>
              <li>Sending you an email or SMS notification (if we have your contact information)</li>
            </ul>
            <p>
              Your continued use of the App after such changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h3>13. Data Protection Officer</h3>
            <p>
              In accordance with the Data Protection Act, 2019, we have appointed a Data Protection Officer (DPO) to oversee our data protection practices. For questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Data Protection Officer:
            </p>
            <p>
              <strong>Phone:</strong> 0712674333<br/>
              <strong>Email:</strong> Contact us through the Contact Us section in the App
            </p>
            <p>
              Our DPO is responsible for ensuring compliance with the Data Protection Act, 2019 and serves as the point of contact for data subjects and the Office of the Data Protection Commissioner.
            </p>
          </section>

          <section>
            <h3>14. Complaints</h3>
            <p>
              If you believe we have not addressed your privacy concerns adequately, you have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) in accordance with Section 56 of the Data Protection Act, 2019.
            </p>
            <p>
              <strong>Office of the Data Protection Commissioner</strong><br/>
              P.O. Box 30920-00100<br/>
              Nairobi, Kenya<br/>
              <strong>Website:</strong> www.odpc.go.ke<br/>
              <strong>Email:</strong> info@odpc.go.ke<br/>
              <strong>Phone:</strong> +254 20 8000 000
            </p>
            <p>
              You may also file a complaint through the ODPC's online portal or by submitting a written complaint to their offices. The ODPC will investigate your complaint and may issue orders, including compensation for damages, if your rights have been violated.
            </p>
          </section>
        </div>
      </div>
    </ScreenWithHeader>
  );
}

