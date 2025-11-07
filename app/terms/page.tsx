import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service | BitBasis",
  description: "BitBasis terms of service and user agreement",
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col text-gray-300 overflow-x-hidden relative isolate">
      {/* Global Background Gradient & Grid */}
      <div 
        className="fixed inset-0 z-[-2] bg-gradient-to-b from-[#0F1116] via-[#171923] to-[#13151D]"
      />
      <div 
        className="fixed inset-0 z-[-1] opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />
      {/* Noise Texture Overlay */}
      <div 
        className="fixed inset-0 z-[-1] opacity-30 mix-blend-soft-light pointer-events-none"
        style={{ 
          backgroundImage: 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter></defs><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>\')',
        }} 
      />

      <div className="container mx-auto px-4 py-12 max-w-8xl relative z-10">
        <div className="flex items-center space-x-2 mb-8">
          <FileText className="h-7 w-7 text-bitcoin-orange" />
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        </div>
        
        <div className="flex flex-col gap-6 bg-gray-800/20 rounded-xl p-8 backdrop-blur-sm">
          <p className="text-gray-400">Effective date: January 1, 2025</p>
          <p className="text-gray-400">Last updated: November 6, 2025</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
            <p className="text-gray-400">
              Welcome to BitBasis.
            </p>
            <p className="text-gray-400">
              BitBasis (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates https://bitbasis.io (hereinafter referred to as &quot;Service&quot;).
            </p>
            <p className="text-gray-400">
              Our Terms of Service (&quot;Terms&quot;, &quot;Terms of Service&quot;) govern your use and access to our website located at https://bitbasis.io and any related sites operated by BitBasis (&quot;Services&quot;). Our Privacy Policy governs your use of our Services and explains how we collect, safeguard and disclose information that results from your use of our websites. Please read it here <Link href="/privacy" className="text-bitcoin-orange hover:underline">https://bitbasis.io/privacy</Link>.
            </p>
            <p className="text-gray-400">
              Your agreement with us includes these Terms and our Privacy Policy (&quot;Agreements&quot;). By using our Services, you are agreeing to be bound by these Agreements. These Agreements apply to all visitors, users and others who wish to access or use our Services. If you do not agree with (or cannot comply with) the Agreements, then you may not use our Services. Please let us know by emailing at hello@bitbasis so we can try to find a solution.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">2. Content and Conduct</h2>
            <p className="text-gray-400">
              Our Services allow you to upload, store, and process Bitcoin transaction data from CSV files (&quot;Content&quot;). When you use our Services, you provide us access to this Content. These Terms do not give us any rights to your Content except for the limited rights that enable us to offer our Services.
            </p>
            <p className="text-gray-400">
              By uploading Content on or through our Services, you represent and warrant that: (i) Content is yours (you own it) and/or you have the right to use it and (ii) that the posting of your Content on or through Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity.
            </p>
            <p className="text-gray-400">
              BitBasis does not review any user generated content on our site unless you give us consent to. You are responsible for ensuring all Content transmitted through our Services are not in violation of any laws and do not wrongfully infringe upon the intellectual property of others.
            </p>
            <p className="text-gray-400">
              You retain any and all of your rights to any Content you submit, post or transmit on or through Service and you are responsible for protecting those rights. We take no responsibility and assume no liability for Content you or any third party transmits or stores on or through Service.
            </p>
            <p className="text-gray-400">
              However, we need your permission to do things like hosting your Content, backing it up, and processing it to provide portfolio calculations and analytics. Our Services also provide you with features like transaction tracking, cost basis calculations, performance metrics, and data visualization. To provide these and other features, BitBasis accesses and stores your Content. You hereby give us permission to do those things, and this permission extends to our trusted third parties we work with.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">3. Disclaimer</h2>
            <p className="text-gray-400">
              BitBasis provides Bitcoin portfolio tracking services, including cost basis calculation, performance metrics, and data visualization. We are not a financial institution, exchange, or investment advisor.
            </p>
            <p className="text-gray-400">
              BitBasis may occasionally provide CSV templates and transaction import tools for client use. Our tools and templates are intended for private use only. They do not constitute legal, financial, or tax advice. We do not review any information you provide us, nor do we offer any opinions, legal or otherwise, regarding the information you provide. Use of our website does not constitute an attorney-client relationship or financial advisory relationship.
            </p>
            <p className="text-gray-400">
              BitBasis is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the accuracy of calculations or data presented. BitBasis is not a tax preparation service, and all tax calculations should be verified by a qualified tax professional.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">4. Your Responsibilities</h2>
            <p className="text-gray-400">
              Your use of our Services must comply with all applicable laws, including intellectual property laws, publicity laws, contract laws, export control laws and regulations. Content in the Services may be protected by others&apos; intellectual property rights. Please do not copy, upload, download, or share content unless you have the right to do so. BitBasis may review your conduct and content for compliance with these Terms. We are not responsible for the content people upload and share via our Services.
            </p>
            <p className="text-gray-400">
              You are responsible to back up your Content. BitBasis is not responsible for any loss of data due to any failure to back up your Content.
            </p>
            <p className="text-gray-400">
              You must be at least 18 years of age to use our Services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">5. Account Registration</h2>
            <p className="text-gray-400">
              When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on Service.
            </p>
            <p className="text-gray-400">
              You are responsible for maintaining the confidentiality of your account. We use magic link authentication (passwordless) via email for account access. You agree to accept responsibility for any and all activities or actions that occur under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
            <p className="text-gray-400">
              You may not use as a username the name of another person or entity or that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity other than you, without appropriate authorization. You may not use as a username any name that is offensive, vulgar or obscene.
            </p>
            <p className="text-gray-400">
              We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders in our sole discretion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">6. Subscriptions</h2>
            <p className="text-gray-400">
              Our Services are billed on a subscription basis (&quot;Subscription(s)&quot;). You will be billed in advance on a recurring and periodic basis (&quot;Billing Cycle&quot;). Billing cycles are set either on a monthly basis for Pro subscriptions, or as a one-time payment for Lifetime subscriptions, depending on the type of subscription plan you select when purchasing a Subscription.
            </p>
            <p className="text-gray-400">
              At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or BitBasis cancels it. You may cancel your Subscription renewal either through your online account management page or by contacting BitBasis customer support team.
            </p>
            <p className="text-gray-400">
              A valid payment method, including credit card, is required to process the payment for your subscription. You shall provide BitBasis with accurate and complete billing information including full name, address, state, zip code, telephone number, and a valid payment method information. By submitting such payment information, you automatically authorize BitBasis to charge all Subscription fees incurred through your account to any such payment instruments.
            </p>
            <p className="text-gray-400">
              Should automatic billing fail to occur for any reason, BitBasis will issue an electronic invoice indicating that you must proceed manually, within a certain deadline date, with the full payment corresponding to the billing period as indicated on the invoice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">7. Fee Changes</h2>
            <p className="text-gray-400">
              BitBasis, in its sole discretion and at any time, may modify Subscription fees and usage allowances for the Subscriptions. Any Subscription fee change will become effective at the end of the then-current Billing Cycle.
            </p>
            <p className="text-gray-400">
              BitBasis will provide you with a reasonable prior notice of any change in Subscription fees to give you an opportunity to terminate your Subscription before such change becomes effective.
            </p>
            <p className="text-gray-400">
              Your continued use of Service after Subscription fee change comes into effect constitutes your agreement to pay the modified Subscription fee amount.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">8. Refunds</h2>
            <p className="text-gray-400">
              You may cancel your Subscription at any time. Refunds are only issued if you cancel your subscription within 14 days of signing up for, upgrading to, or renewing a Subscription.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">9. Prohibited Uses</h2>
            <p className="text-gray-400">
              You agree to not misuse our Service or help anyone else do so. You may use our Services only for lawful purposes and in accordance with these Terms. For example, the following uses are strictly prohibited:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>In any way that violates any applicable national or international law or regulation.</li>
              <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any &quot;junk mail&quot;, &quot;chain letter,&quot; &quot;spam,&quot; or any other similar solicitation.</li>
              <li>To impersonate or attempt to impersonate Company, a Company employee, another user, or any other person or entity.</li>
              <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</li>
              <li>To engage in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of Service, or which, as determined by us, may harm or offend Company or users of Service or expose them to liability.</li>
            </ul>
            <p className="text-gray-400">
              Additionally, you agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Use Service in any manner that could disable, overburden, damage, or impair Service or interfere with any other party&apos;s use of Service, including their ability to engage in real time activities through Service.</li>
              <li>Use any robot, spider, or other automatic device, process, or means to access Service for any purpose, including monitoring or copying any of the material on Service.</li>
              <li>Use any manual process to monitor or copy any of the material on our Services or for any other unauthorized purpose without our prior written consent.</li>
              <li>Use any device, software, or routine that interferes with the proper working of Service.</li>
              <li>Introduce any viruses, trojan horses, worms, logic bombs, or other material which is malicious or technologically harmful.</li>
              <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of Service, the server on which Service is stored, or any server, computer, or database connected to Service.</li>
              <li>Attack Service via a denial-of-service attack or a distributed denial-of-service attack.</li>
              <li>Take any action that may damage or falsify Company rating.</li>
              <li>Probe, scan, or test the vulnerability of our system or network.</li>
              <li>Breach or otherwise circumvent any security or authentication measures.</li>
              <li>Otherwise attempt to interfere with or reverse engineering the proper working of Service.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">10. Analytics</h2>
            <p className="text-gray-400">
              We may use third-party Service Providers to monitor and analyze the use of our Service. A list of some of our third-party Service Providers is as follows:
            </p>
            
            <div className="space-y-3 mt-3">
              <h3 className="text-lg font-medium text-white">Vercel Analytics</h3>
              <p className="text-gray-400">
                Vercel Analytics is a privacy-focused web analytics service offered by Vercel that tracks and reports website traffic. Vercel Analytics collects anonymous data without using cookies. It identifies users by a hash created from the incoming request, ensuring that individuals cannot be tracked across different websites or applications. The hash is reset daily, ensuring users cannot be tracked across different days.
              </p>
              <p className="text-gray-400">
                For more information on the privacy practices of Vercel, please visit the Vercel Privacy Terms web page: https://vercel.com/legal/privacy-policy
              </p>
            </div>

            <div className="space-y-3 mt-3">
              <h3 className="text-lg font-medium text-white">Vercel Speed Insights</h3>
              <p className="text-gray-400">
                Vercel Speed Insights provides performance metrics without associating data points with individual visitors or IP addresses. The collected data is anonymous and includes information such as route, URL, network speed, browser, device type, and country.
              </p>
              <p className="text-gray-400">
                For more information on the privacy practices of Vercel Speed Insights, please visit the Vercel Speed Insights Privacy Policy web page: https://vercel.com/docs/speed-insights/privacy-policy
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">11. No Use By Minors</h2>
            <p className="text-gray-400">
              Service is intended only for access and use by individuals at least eighteen (18) years old. By accessing or using any of the Company, you warrant and represent that you are at least eighteen (18) years of age and with the full authority, right, and capacity to enter into this agreement and abide by all of the terms and conditions of Terms. If you are not at least eighteen (18) years old, you are prohibited from both the access and usage of Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">12. Intellectual Property</h2>
            <p className="text-gray-400">
              Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of BitBasis and its licensors. Service is protected by copyright, trademark, and other laws of the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of BitBasis.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">13. Copyright Policy</h2>
            <p className="text-gray-400">
              We respect the intellectual property rights of others. It is our policy to respond to any claim that Content posted on Service infringes on the copyright or other intellectual property rights (&quot;Infringement&quot;) of any person or entity.
            </p>
            <p className="text-gray-400">
              If you are a copyright owner, or authorized on behalf of one, and you believe that the copyrighted work has been copied in a way that constitutes copyright infringement, please submit your claim via email to hello@bitbasis, with the subject line: &quot;Copyright Infringement&quot; and include in your claim a detailed description of the alleged Infringement as detailed below, under &quot;DMCA Notice and Procedure for Copyright Infringement Claims&quot;
            </p>
            <p className="text-gray-400">
              You may be held accountable for damages (including costs and attorneys&apos; fees) for misrepresentation or bad-faith claims on the infringement of any Content found on and/or through Service on your copyright.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">14. DMCA Notice and Procedure for Copyright Infringement Claims</h2>
            <p className="text-gray-400">
              BitBasis respects the intellectual property of our users and expects you to do the same. In accordance with Digital Millennium Copyright Act of 1998, available at http://www.copyright.gov/legislation/dmca.pdf, BitBasis will respond expeditiously to claims of copyright infringement committed using BitBasis Services if such claims are reported to BitBasis&apos;s Designated Copyright Agent.
            </p>
            <p className="text-gray-400">
              If you are a copyright owner, you may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) by providing our designated Copyright Agent with the following information in writing (see 17 U.S.C 512(c)(3) for further detail):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>an electronic or physical signature of the person authorized to act on behalf of the owner of the copyright&apos;s interest;</li>
              <li>a description of the copyrighted work that you claim has been infringed, including the URL (i.e., web page address) of the location where the copyrighted work exists or a copy of the copyrighted work;</li>
              <li>identification of the URL or other specific location on Service where the material that you claim is infringing is located;</li>
              <li>your address, telephone number, and email address;</li>
              <li>a statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law;</li>
              <li>a statement by you, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner&apos;s behalf.</li>
            </ul>
            <p className="text-gray-400">
              You can contact our Copyright Agent via email at hello@bitbasis
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">15. Error Reporting and Feedback</h2>
            <p className="text-gray-400">
              You may provide us directly at hello@bitbasis with information and feedback concerning errors, suggestions for improvements, ideas, problems, complaints, and other matters related to our Service (&quot;Feedback&quot;). You acknowledge and agree that: (i) you shall not retain, acquire or assert any intellectual property right or other right, title or interest in or to the Feedback; (ii) Company may have development ideas similar to the Feedback; (iii) Feedback does not contain confidential information or proprietary information from you or any third party; and (iv) Company is not under any obligation of confidentiality with respect to the Feedback. In the event the transfer of the ownership to the Feedback is not possible due to applicable mandatory laws, you grant Company and its affiliates an exclusive, transferable, irrevocable, free-of-charge, sub-licensable, unlimited and perpetual right to use (including copy, modify, create derivative works, publish, distribute and commercialize) Feedback in any manner and for any purpose.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">16. Links To Other Websites</h2>
            <p className="text-gray-400">
              Our Services may contain links to third party web sites or services that are not owned or controlled by BitBasis.
            </p>
            <p className="text-gray-400">
              BitBasis has no control over, and assumes no responsibility for the content, privacy policies, or practices of any third party web sites or services. We do not warrant the offerings of any of these entities/individuals or their websites.
            </p>
            <p className="text-gray-400">
              YOU ACKNOWLEDGE AND AGREE THAT BITBASIS SHALL NOT BE RESPONSIBLE OR LIABLE, DIRECTLY OR INDIRECTLY, FOR ANY DAMAGE OR LOSS CAUSED OR ALLEGED TO BE CAUSED BY OR IN CONNECTION WITH USE OF OR RELIANCE ON ANY SUCH CONTENT, GOODS OR SERVICES AVAILABLE ON OR THROUGH ANY SUCH THIRD PARTY WEB SITES OR SERVICES.
            </p>
            <p className="text-gray-400">
              WE STRONGLY ADVISE YOU TO READ THE TERMS OF SERVICE AND PRIVACY POLICIES OF ANY THIRD PARTY WEB SITES OR SERVICES THAT YOU VISIT.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">17. Disclaimer Of Warranty</h2>
            <p className="text-gray-400">
              THESE SERVICES ARE PROVIDED BY BITBASIS ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. BITBASIS MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THEIR SERVICES, OR THE INFORMATION, CONTENT OR MATERIALS INCLUDED THEREIN. YOU EXPRESSLY AGREE THAT YOUR USE OF THESE SERVICES, THEIR CONTENT, AND ANY SERVICES OR ITEMS OBTAINED FROM US IS AT YOUR SOLE RISK.
            </p>
            <p className="text-gray-400">
              NEITHER BITBASIS NOR ANY PERSON ASSOCIATED WITH IT MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE SERVICES. WITHOUT LIMITING THE FOREGOING, NEITHER COMPANY NOR ANYONE ASSOCIATED WITH COMPANY REPRESENTS OR WARRANTS THAT THE SERVICES, THEIR CONTENT, OR ANY SERVICES OR ITEMS OBTAINED THROUGH THE SERVICES WILL BE ACCURATE, RELIABLE, ERROR-FREE, OR UNINTERRUPTED, THAT DEFECTS WILL BE CORRECTED, THAT THE SERVICES OR THE SERVER THAT MAKES IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS OR THAT THE SERVICES OR ANY SERVICES OR ITEMS OBTAINED THROUGH THE SERVICES WILL OTHERWISE MEET YOUR NEEDS OR EXPECTATIONS.
            </p>
            <p className="text-gray-400">
              COMPANY HEREBY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT, AND FITNESS FOR PARTICULAR PURPOSE.
            </p>
            <p className="text-gray-400">
              THE FOREGOING DOES NOT AFFECT ANY WARRANTIES WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">18. Limitation Of Liability</h2>
            <p className="text-gray-400">
              EXCEPT AS PROHIBITED BY LAW, YOU WILL HOLD US AND OUR OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS HARMLESS FOR ANY INDIRECT, PUNITIVE, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGE, HOWEVER IT ARISES (INCLUDING ATTORNEYS&apos; FEES AND ALL RELATED COSTS AND EXPENSES OF LITIGATION AND ARBITRATION, OR AT TRIAL OR ON APPEAL, IF ANY, WHETHER OR NOT LITIGATION OR ARBITRATION IS INSTITUTED), WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE, OR OTHER TORTIOUS ACTION, OR ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, INCLUDING WITHOUT LIMITATION ANY CLAIM FOR PERSONAL INJURY OR PROPERTY DAMAGE, ARISING FROM THIS AGREEMENT AND ANY VIOLATION BY YOU OF ANY FEDERAL, STATE, OR LOCAL LAWS, STATUTES, RULES, OR REGULATIONS, EVEN IF COMPANY HAS BEEN PREVIOUSLY ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. EXCEPT AS PROHIBITED BY LAW, IF THERE IS LIABILITY FOUND ON THE PART OF COMPANY, IT WILL BE LIMITED TO THE AMOUNT PAID FOR THE PRODUCTS AND/OR SERVICES, AND UNDER NO CIRCUMSTANCES WILL THERE BE CONSEQUENTIAL OR PUNITIVE DAMAGES. SOME STATES DO NOT ALLOW THE EXCLUSION OR LIMITATION OF PUNITIVE, INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE PRIOR LIMITATION OR EXCLUSION MAY NOT APPLY TO YOU.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">19. Termination</h2>
            <p className="text-gray-400">
              We may terminate or suspend your account and bar access to our Services immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of Terms.
            </p>
            <p className="text-gray-400">
              If you wish to terminate your account, you may simply discontinue using our Services or request account deletion through your account settings.
            </p>
            <p className="text-gray-400">
              All provisions of Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability. Termination of an account may result in losing access to files and information stored on our system.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">20. User Data</h2>
            <p className="text-gray-400">
              BitBasis will maintain certain data that you transmit to our websites for the purpose of managing the performance of our Services, as well as data relating to your use of the websites. Although we perform regular backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using our Services. BitBasis has no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">21. Force Majeure and Discontinuation of Services</h2>
            <p className="text-gray-400">
              We might decide to discontinue our Services in response to unforeseen circumstances beyond BitBasis&apos;s control. Any disruption or discontinuation of Services will not be considered a breach of this Agreement if such disruption or discontinuation is caused by natural disasters, epidemics, pandemics and quarantines, war, terrorist attacks and other instances of violence, cyber attacks such as DoS, DDoS, MitM, SQL injection, phishing attacks, or any other malicious introduction of viruses and disabling devices caused by third parties, actions taken by government authorities such as changes in laws, regulations, or orders, strikes and work slow-downs, shortages of power, supplies, infrastructure or transportation, and any acts beyond BitBasis&apos;s reasonable control.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">22. Dispute Resolution</h2>
            <p className="text-gray-400">
              Let&apos;s address your concerns without a formal legal case first. You hereby agree to try to resolve any legal dispute informally with BitBasis before commencing a formal legal claim against BitBasis. You may reach us at hello@bitbasis. We will try to resolve the dispute informally by contacting you via email.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">23. Governing Law</h2>
            <p className="text-gray-400">
              These Terms shall be governed and construed in accordance with the laws of the United States without regard to its conflict of law provisions. However, some countries have laws that require agreements to be governed by local laws of the user domicile. This paragraph does not override those laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">24. Changes To Service</h2>
            <p className="text-gray-400">
              We reserve the right to withdraw or amend our Service, and any service or material we provide via Service, in our sole discretion without notice. We will not be liable if for any reason all or any part of Service is unavailable at any time or for any period. From time to time, we may restrict access to some parts of Service, or the entire Service, to users, including registered users.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">25. Amendments To Terms</h2>
            <p className="text-gray-400">
              We may amend Terms at any time by posting the amended terms on this site. It is your responsibility to review these Terms periodically.
            </p>
            <p className="text-gray-400">
              Your continued use of the Platform following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you.
            </p>
            <p className="text-gray-400">
              By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">26. Waiver And Severability</h2>
            <p className="text-gray-400">
              No waiver by Company of any term or condition set forth in Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of Company to assert a right or provision under Terms shall not constitute a waiver of such right or provision.
            </p>
            <p className="text-gray-400">
              If any provision of Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of Terms will continue in full force and effect.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">27. Acknowledgement</h2>
            <p className="text-gray-400">
              BY USING SERVICE OR OTHER SERVICES PROVIDED BY US, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">28. Contact Us</h2>
            <p className="text-gray-400">
              Please send your feedback, comments, requests for technical support: By email: hello@bitbasis.
            </p>
          </section>

          <div className="mt-8 flex justify-center">
            <Button asChild variant="orange-outline" className="relative overflow-hidden bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold shadow-lg hover:shadow-bitcoin-orange/30 transform hover:-translate-y-px transition-all duration-300 group">
              <Link href="/">
                <span className="relative z-10">Return to Home</span>
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-300"></span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 