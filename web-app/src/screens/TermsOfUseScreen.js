import React from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenWithHeader from '../components/ScreenWithHeader';
import './TermsOfUseScreen.css';

export default function TermsOfUseScreen() {
  return (
    <ScreenWithHeader title="Terms of Use">
      <div className="terms-screen">
        <div className="terms-content">
          <h2>Terms of Use</h2>
          <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h3>1. Agreement to Terms</h3>
            <p>
              By accessing, downloading, installing, or using the Doc Time mobile application ("App"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, you may not access or use the App. These Terms constitute a legally binding agreement between you and Doc Time ("we," "us," or "our").
            </p>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last updated" date at the top of this document. Your continued use of the App after such modifications constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h3>2. Description of Service</h3>
            <p>
              Doc Time is a case management application designed for healthcare professionals to manage medical cases, track procedures, maintain patient records, generate invoices, and coordinate with surgical teams. The App facilitates communication between healthcare providers and assists in the organization and documentation of medical procedures.
            </p>
          </section>

          <section>
            <h3>3. Eligibility and Account Registration</h3>
            <p>
              To use the App, you must:
            </p>
            <ul>
              <li>Be at least 18 years of age or have the legal capacity to enter into binding agreements in your jurisdiction</li>
              <li>Be a licensed healthcare professional or authorized medical personnel</li>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your account credentials, including your phone number and PIN</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <p>
              You are solely responsible for maintaining the confidentiality of your account credentials. You agree to immediately notify us of any unauthorized use of your account or any other breach of security.
            </p>
          </section>

          <section>
            <h3>4. Acceptable Use</h3>
            <p>
              You agree to use the App only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul>
              <li>Use the App in any way that violates any applicable federal, state, local, or international law or regulation</li>
              <li>Transmit any data that contains viruses, malware, or other harmful code</li>
              <li>Attempt to gain unauthorized access to the App, user accounts, or computer systems</li>
              <li>Reverse engineer, decompile, or disassemble any portion of the App</li>
              <li>Interfere with or disrupt the App or servers connected to the App</li>
              <li>Use automated systems to access the App without our express written permission</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
              <li>Collect or store personal data about other users without their consent</li>
              <li>Use the App to transmit spam, unsolicited messages, or promotional materials</li>
            </ul>
          </section>

          <section>
            <h3>5. Medical Information and Professional Responsibility</h3>
            <p>
              <strong>Important Medical Disclaimer:</strong> The Doc Time App is a case management tool and does not provide medical advice, diagnosis, or treatment recommendations. All medical decisions must be made by qualified healthcare professionals in accordance with applicable medical standards and regulations.
            </p>
            <p>
              You acknowledge and agree that:
            </p>
            <ul>
              <li>You are solely responsible for all medical decisions and patient care</li>
              <li>The App does not replace professional medical judgment</li>
              <li>You must comply with all applicable medical regulations, including patient privacy laws (such as HIPAA, GDPR, or local equivalents)</li>
              <li>You are responsible for maintaining accurate and complete medical records</li>
              <li>The App is not a substitute for proper medical documentation practices</li>
            </ul>
          </section>

          <section>
            <h3>6. Patient Data and Privacy</h3>
            <p>
              You are responsible for ensuring that all patient information entered into the App is handled in compliance with applicable Kenyan privacy and data protection laws, including but not limited to:
            </p>
            <ul>
              <li>The Data Protection Act, 2019 (Kenya) - which classifies health data as sensitive personal data requiring additional safeguards</li>
              <li>The Digital Health Act, 2023 - providing legal framework for management of health data in digital formats</li>
              <li>The Health Act, 2017 - including provisions protecting confidentiality of patient information</li>
              <li>The Data Protection (General) Regulations, 2021 - detailing requirements for processing personal data, including health data</li>
              <li>The Medical Practitioners and Dentists Act - governing professional conduct and patient confidentiality</li>
            </ul>
            <p>
              Under Kenyan law, health data may only be processed by or under the responsibility of a healthcare provider or by a person subject to professional confidentiality obligations. You must obtain explicit consent from data subjects before processing their health data, except where processing is necessary for medical purposes or as required by law.
            </p>
            <p>
              You represent and warrant that you have obtained all necessary consents and authorizations before entering patient information into the App. You agree to indemnify and hold us harmless from any claims arising from your failure to comply with applicable privacy laws, including those enforced by the Office of the Data Protection Commissioner (ODPC).
            </p>
          </section>

          <section>
            <h3>7. Intellectual Property Rights</h3>
            <p>
              The App, including its original content, features, functionality, design, logos, and trademarks, is owned by Doc Time and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p>
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the App for your personal, non-commercial use in accordance with these Terms. This license does not include:
            </p>
            <ul>
              <li>Any resale or commercial use of the App or its contents</li>
              <li>Any collection and use of product listings, descriptions, or prices</li>
              <li>Any derivative use of the App or its contents</li>
              <li>Any use of data mining, robots, or similar data gathering and extraction tools</li>
            </ul>
          </section>

          <section>
            <h3>8. User Content</h3>
            <p>
              You retain ownership of any data, information, or content you submit, post, or display through the App ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and distribute such User Content solely for the purpose of providing and improving the App's services.
            </p>
            <p>
              You represent and warrant that:
            </p>
            <ul>
              <li>You own or have the necessary rights to all User Content</li>
              <li>User Content does not violate any third-party rights, including intellectual property or privacy rights</li>
              <li>User Content complies with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h3>9. Service Availability and Modifications</h3>
            <p>
              We reserve the right to modify, suspend, or discontinue the App or any part thereof at any time, with or without notice. We do not guarantee that the App will be available at all times or that it will be free from errors, viruses, or other harmful components.
            </p>
            <p>
              We may perform scheduled or unscheduled maintenance, which may result in temporary unavailability of the App. We will make reasonable efforts to minimize disruption but are not liable for any inconvenience caused.
            </p>
          </section>

          <section>
            <h3>10. Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DOC TIME, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul>
              <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
              <li>Damages resulting from your use or inability to use the App</li>
              <li>Damages resulting from unauthorized access to or alteration of your data</li>
              <li>Damages resulting from any conduct or content of third parties on the App</li>
              <li>Any other damages arising out of or in connection with these Terms or the App</li>
            </ul>
            <p>
              Our total liability to you for all claims arising from or related to the App shall not exceed the amount you paid to us in the twelve (12) months preceding the claim, or one hundred dollars ($100), whichever is greater.
            </p>
          </section>

          <section>
            <h3>11. Indemnification</h3>
            <p>
              You agree to defend, indemnify, and hold harmless Doc Time and its officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with:
            </p>
            <ul>
              <li>Your use of the App</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights, including patient privacy rights</li>
              <li>Your violation of any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h3>12. Termination</h3>
            <p>
              We may terminate or suspend your account and access to the App immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the App will cease immediately.
            </p>
            <p>
              You may terminate your account at any time by contacting us through the Contact Us section of the App. Upon termination, we will make reasonable efforts to provide you with a copy of your data, subject to applicable legal and regulatory requirements.
            </p>
          </section>

          <section>
            <h3>13. Governing Law and Dispute Resolution</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya, without regard to its conflict of law provisions. Any disputes arising out of or relating to these Terms or the App shall be resolved through:
            </p>
            <ul>
              <li>Binding arbitration in accordance with the Arbitration Act, 1995 (Kenya), or</li>
              <li>The courts of competent jurisdiction in Kenya, with the High Court of Kenya having exclusive jurisdiction for matters not subject to arbitration</li>
            </ul>
            <p>
              You agree to submit to the jurisdiction of Kenyan courts and waive any objection to venue in Kenya.
            </p>
          </section>

          <section>
            <h3>14. Severability</h3>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h3>15. Entire Agreement</h3>
            <p>
              These Terms constitute the entire agreement between you and Doc Time regarding the use of the App and supersede all prior agreements and understandings, whether written or oral.
            </p>
          </section>

          <section>
            <h3>16. Contact Information</h3>
            <p>
              If you have any questions about these Terms of Use, please contact us at:
            </p>
            <p>
              <strong>Phone:</strong> 0712674333<br/>
              <strong>Email:</strong> Contact us through the Contact Us section in the App
            </p>
          </section>
        </div>
      </div>
    </ScreenWithHeader>
  );
}

