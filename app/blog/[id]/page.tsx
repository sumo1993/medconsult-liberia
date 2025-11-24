'use client';

import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, User, ArrowLeft, BookOpen } from 'lucide-react';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  // Blog post data (in a real app, this would come from a database or API)
  const posts = [
    {
      id: '13',
      title: 'URGENT: HIV Crisis in Liberia - Get Tested Now',
      excerpt: 'Ministry of Health announces critical HIV situation. Free testing and treatment available nationwide.',
      category: 'Health Crisis',
      author: 'Ministry of Health',
      date: '2024-11-23',
      content: `
        <h2>Critical HIV Situation in Liberia</h2>
        <p>The Ministry of Health has announced a critical HIV situation in Liberia following recent surveillance data showing increased transmission rates. This alert calls for immediate action from all Liberians to get tested and access available prevention and treatment services.</p>
        
        <h2>Current Situation</h2>
        <p>Recent data indicates:</p>
        <ul>
          <li>Rising HIV infection rates, particularly among young adults (15-35 years)</li>
          <li>Increased mother-to-child transmission cases</li>
          <li>Low testing rates in rural communities</li>
          <li>Treatment interruptions due to stigma and access barriers</li>
          <li>Growing number of AIDS-related complications</li>
        </ul>
        
        <h2>Why This is Critical</h2>
        <p>HIV/AIDS remains a major public health challenge in Liberia. Without immediate intervention:</p>
        <ul>
          <li>More people will unknowingly transmit the virus</li>
          <li>Late diagnosis leads to advanced disease and death</li>
          <li>Mother-to-child transmission will continue</li>
          <li>Healthcare system will be overwhelmed</li>
          <li>Economic impact on families and communities</li>
        </ul>
        
        <h2>Understanding HIV/AIDS</h2>
        <p>HIV (Human Immunodeficiency Virus) attacks the body's immune system. Without treatment, it progresses to AIDS (Acquired Immunodeficiency Syndrome), making the body unable to fight infections.</p>
        
        <h3>How HIV Spreads</h3>
        <ul>
          <li>Unprotected sexual contact</li>
          <li>Sharing needles or syringes</li>
          <li>Mother-to-child during pregnancy, birth, or breastfeeding</li>
          <li>Blood transfusions with infected blood (rare in screened blood)</li>
        </ul>
        
        <h3>HIV Does NOT Spread Through</h3>
        <ul>
          <li>Casual contact (hugging, shaking hands)</li>
          <li>Sharing food or drinks</li>
          <li>Mosquito bites</li>
          <li>Toilet seats</li>
          <li>Swimming pools</li>
        </ul>
        
        <h2>Symptoms to Watch For</h2>
        <p>Many people with HIV have no symptoms for years. Early symptoms may include:</p>
        <ul>
          <li>Fever and night sweats</li>
          <li>Persistent fatigue</li>
          <li>Rapid weight loss</li>
          <li>Swollen lymph nodes</li>
          <li>Recurring infections</li>
          <li>Persistent diarrhea</li>
          <li>Skin rashes or sores</li>
        </ul>
        
        <h2>FREE Testing Available</h2>
        <p>The government has made HIV testing FREE at all health facilities nationwide. Testing locations include:</p>
        <ul>
          <li>All government hospitals and health centers</li>
          <li>Private clinics participating in the program</li>
          <li>Mobile testing units in communities</li>
          <li>Voluntary Counseling and Testing (VCT) centers</li>
        </ul>
        
        <h3>Testing Process</h3>
        <ol>
          <li>Visit any health facility</li>
          <li>Request HIV testing (confidential)</li>
          <li>Receive pre-test counseling</li>
          <li>Quick blood test (results in 15-30 minutes)</li>
          <li>Post-test counseling and support</li>
        </ol>
        
        <h2>Treatment is Available and FREE</h2>
        <p>If you test positive, FREE treatment is available through the National AIDS Control Program:</p>
        
        <h3>Antiretroviral Therapy (ART)</h3>
        <ul>
          <li>Highly effective medications that control HIV</li>
          <li>Prevents progression to AIDS</li>
          <li>Allows people to live long, healthy lives</li>
          <li>Reduces transmission risk to near zero when viral load is undetectable</li>
          <li>FREE at all ART centers nationwide</li>
        </ul>
        
        <h3>Additional Support Services</h3>
        <ul>
          <li>Nutritional support</li>
          <li>Psychosocial counseling</li>
          <li>Treatment for opportunistic infections</li>
          <li>Support groups</li>
          <li>Home-based care</li>
        </ul>
        
        <h2>Prevention Methods</h2>
        
        <h3>1. Safe Sex Practices</h3>
        <ul>
          <li>Use condoms correctly and consistently</li>
          <li>Limit number of sexual partners</li>
          <li>Get tested with your partner</li>
          <li>Avoid sex when under influence of alcohol or drugs</li>
        </ul>
        
        <h3>2. Pre-Exposure Prophylaxis (PrEP)</h3>
        <p>Daily medication for HIV-negative people at high risk. PrEP is over 90% effective in preventing HIV infection. Available at select health facilities.</p>
        
        <h3>3. Post-Exposure Prophylaxis (PEP)</h3>
        <p>Emergency medication taken within 72 hours after potential exposure. Available at all major hospitals.</p>
        
        <h3>4. Prevention of Mother-to-Child Transmission (PMTCT)</h3>
        <p>Pregnant women should:</p>
        <ul>
          <li>Get tested during pregnancy</li>
          <li>Take ART if positive</li>
          <li>Deliver at health facility</li>
          <li>Follow infant feeding guidelines</li>
          <li>Test baby at recommended intervals</li>
        </ul>
        
        <h2>Breaking the Stigma</h2>
        <p>HIV stigma prevents people from getting tested and treated. Remember:</p>
        <ul>
          <li>HIV is a medical condition, not a moral judgment</li>
          <li>Anyone can get HIV regardless of lifestyle</li>
          <li>People living with HIV can live normal, productive lives</li>
          <li>With treatment, HIV-positive people cannot transmit the virus</li>
          <li>Support and compassion save lives</li>
        </ul>
        
        <h2>What You Should Do NOW</h2>
        <ol>
          <li><strong>Get Tested:</strong> Know your status - testing is free and confidential</li>
          <li><strong>Practice Prevention:</strong> Use condoms and reduce risky behaviors</li>
          <li><strong>Start Treatment:</strong> If positive, begin ART immediately</li>
          <li><strong>Encourage Others:</strong> Talk to family and friends about testing</li>
          <li><strong>Fight Stigma:</strong> Support people living with HIV</li>
        </ol>
        
        <h2>Emergency Contacts</h2>
        <p><strong>National AIDS Control Program Hotline:</strong> [Insert Number]</p>
        <p><strong>HIV Testing Centers:</strong> Visit any government health facility</p>
        <p><strong>24/7 Support:</strong> Contact MedConsult Liberia for confidential consultation</p>
        
        <h2>Key Message</h2>
        <p><strong>HIV is preventable. HIV is treatable. HIV is NOT a death sentence. Get tested today. Start treatment if positive. Save lives.</strong></p>
        
        <p><strong>For confidential HIV consultation, testing guidance, or treatment support, contact MedConsult Liberia immediately. Our healthcare professionals are here to help without judgment.</strong></p>
      `
    },
    {
      id: '14',
      title: 'Monkeypox Outbreak Alert: Prevention and Symptoms',
      excerpt: 'Confirmed monkeypox cases in Liberia. Learn how to protect yourself and recognize symptoms.',
      category: 'Disease Outbreak',
      author: 'MedConsult Health Team',
      date: '2024-11-23',
      content: `
        <h2>Monkeypox Confirmed in Liberia</h2>
        <p>The Ministry of Health has confirmed cases of monkeypox (mpox) in Liberia. While the situation is being closely monitored, it's important for all Liberians to understand this disease and how to protect themselves.</p>
        
        <h2>What is Monkeypox?</h2>
        <p>Monkeypox (now also called mpox) is a viral disease that causes a rash and flu-like symptoms. It's related to smallpox but generally less severe. Most people recover fully within 2-4 weeks.</p>
        
        <h2>How Monkeypox Spreads</h2>
        
        <h3>Person-to-Person Transmission</h3>
        <ul>
          <li>Direct contact with monkeypox rash, scabs, or body fluids</li>
          <li>Respiratory droplets during prolonged face-to-face contact</li>
          <li>Touching contaminated items (clothing, bedding, towels)</li>
          <li>Intimate physical contact including sexual contact</li>
        </ul>
        
        <h3>Animal-to-Person Transmission</h3>
        <ul>
          <li>Contact with infected animals (rodents, primates)</li>
          <li>Bites or scratches from infected animals</li>
          <li>Preparing or eating infected bushmeat</li>
        </ul>
        
        <h2>Recognizing Symptoms</h2>
        <p>Symptoms typically appear 5-21 days after exposure:</p>
        
        <h3>Early Symptoms (1-5 days)</h3>
        <ul>
          <li>Fever</li>
          <li>Headache</li>
          <li>Muscle aches and backache</li>
          <li>Swollen lymph nodes (distinguishes from smallpox)</li>
          <li>Chills</li>
          <li>Exhaustion</li>
        </ul>
        
        <h3>Rash Development (1-3 days after fever)</h3>
        <p>The rash goes through several stages:</p>
        <ol>
          <li><strong>Macules:</strong> Flat, discolored spots</li>
          <li><strong>Papules:</strong> Raised bumps</li>
          <li><strong>Vesicles:</strong> Fluid-filled blisters</li>
          <li><strong>Pustules:</strong> Pus-filled lesions</li>
          <li><strong>Scabs:</strong> Crusted lesions that eventually fall off</li>
        </ol>
        
        <h3>Rash Locations</h3>
        <p>The rash often begins on the face and spreads to:</p>
        <ul>
          <li>Face (95% of cases)</li>
          <li>Palms of hands and soles of feet (75%)</li>
          <li>Mouth, genitals, and eyes</li>
          <li>Trunk and limbs</li>
        </ul>
        
        <h2>Prevention Measures</h2>
        
        <h3>1. Avoid Contact with Infected Persons</h3>
        <ul>
          <li>Stay away from people with monkeypox rash</li>
          <li>Don't touch rash, scabs, or body fluids</li>
          <li>Avoid sharing personal items</li>
          <li>Maintain physical distance from sick individuals</li>
        </ul>
        
        <h3>2. Practice Good Hygiene</h3>
        <ul>
          <li>Wash hands frequently with soap and water</li>
          <li>Use alcohol-based hand sanitizer</li>
          <li>Avoid touching your face</li>
          <li>Clean and disinfect surfaces regularly</li>
        </ul>
        
        <h3>3. Avoid Contact with Animals</h3>
        <ul>
          <li>Don't handle sick or dead animals</li>
          <li>Avoid bushmeat</li>
          <li>Don't touch rodents or primates</li>
          <li>Report sick animals to authorities</li>
        </ul>
        
        <h3>4. Safe Practices</h3>
        <ul>
          <li>Limit close physical contact with multiple partners</li>
          <li>Use protection during intimate contact</li>
          <li>Avoid crowded spaces if outbreak is active</li>
          <li>Wear masks in healthcare settings</li>
        </ul>
        
        <h2>What to Do If You Have Symptoms</h2>
        
        <h3>Immediate Actions</h3>
        <ol>
          <li><strong>Isolate Yourself:</strong> Stay away from others immediately</li>
          <li><strong>Call Healthcare Provider:</strong> Don't go directly to facility without calling first</li>
          <li><strong>Cover Rash:</strong> Keep lesions covered with clothing or bandages</li>
          <li><strong>Avoid Contact:</strong> Don't share items or have physical contact</li>
          <li><strong>Wear a Mask:</strong> If you must be around others</li>
        </ol>
        
        <h3>Seek Medical Care If:</h3>
        <ul>
          <li>You develop a rash with fever</li>
          <li>You've been in contact with someone with monkeypox</li>
          <li>You've traveled to areas with active outbreaks</li>
          <li>Symptoms worsen or don't improve</li>
        </ul>
        
        <h2>Treatment</h2>
        <p>Most people recover without specific treatment. Supportive care includes:</p>
        <ul>
          <li>Pain relief medication</li>
          <li>Fever management</li>
          <li>Keeping rash clean and dry</li>
          <li>Preventing secondary infections</li>
          <li>Adequate hydration and nutrition</li>
        </ul>
        
        <h3>Antiviral Treatment</h3>
        <p>For severe cases or high-risk individuals, antiviral medications may be available. Consult healthcare providers for eligibility.</p>
        
        <h2>Isolation Guidelines</h2>
        <p>If diagnosed with monkeypox:</p>
        <ul>
          <li>Isolate until all scabs fall off and new skin forms</li>
          <li>Usually 2-4 weeks</li>
          <li>Stay in separate room if possible</li>
          <li>Use separate bathroom if available</li>
          <li>Don't share items with household members</li>
          <li>Wear mask and cover rash when around others</li>
        </ul>
        
        <h2>Caring for Someone with Monkeypox</h2>
        <p>If you must care for someone with monkeypox:</p>
        <ul>
          <li>Wear disposable gloves</li>
          <li>Wear a well-fitting mask</li>
          <li>Avoid touching rash or contaminated items</li>
          <li>Wash hands after any contact</li>
          <li>Clean and disinfect surfaces daily</li>
          <li>Handle laundry carefully (don't shake)</li>
        </ul>
        
        <h2>Vaccination</h2>
        <p>Vaccines for monkeypox exist and may be available for:</p>
        <ul>
          <li>Healthcare workers treating monkeypox patients</li>
          <li>Laboratory personnel handling specimens</li>
          <li>People exposed to confirmed cases</li>
          <li>High-risk individuals during outbreaks</li>
        </ul>
        <p>Contact the Ministry of Health for vaccination availability.</p>
        
        <h2>High-Risk Groups</h2>
        <p>Certain groups may experience more severe illness:</p>
        <ul>
          <li>Children under 8 years</li>
          <li>Pregnant women</li>
          <li>People with weakened immune systems</li>
          <li>People with skin conditions like eczema</li>
        </ul>
        
        <h2>Reporting and Surveillance</h2>
        <p>If you suspect monkeypox:</p>
        <ul>
          <li>Report to nearest health facility</li>
          <li>Call Ministry of Health hotline</li>
          <li>Cooperate with contact tracing efforts</li>
          <li>Provide information about recent contacts</li>
        </ul>
        
        <h2>Key Takeaways</h2>
        <ul>
          <li>Monkeypox is spreading but preventable</li>
          <li>Most people recover fully within 2-4 weeks</li>
          <li>Early isolation prevents spread to others</li>
          <li>Good hygiene and avoiding contact are key</li>
          <li>Seek medical care if you develop symptoms</li>
        </ul>
        
        <h2>Emergency Contacts</h2>
        <p><strong>Ministry of Health Hotline:</strong> [Insert Number]</p>
        <p><strong>Monkeypox Reporting:</strong> Contact nearest health facility</p>
        <p><strong>24/7 Consultation:</strong> MedConsult Liberia</p>
        
        <p><strong>If you have symptoms or have been exposed to monkeypox, contact MedConsult Liberia immediately for confidential consultation and guidance on next steps.</strong></p>
      `
    },
    {
      id: '4',
      title: 'COVID-19 Update: New Variant Prevention Guidelines',
      excerpt: 'Stay informed about the latest COVID-19 variants and updated prevention measures for Liberia.',
      category: 'Health Alert',
      author: 'MedConsult Health Team',
      date: '2024-11-20',
      content: `
        <h2>Current COVID-19 Situation in Liberia</h2>
        <p>As new COVID-19 variants continue to emerge globally, it's essential to stay informed about prevention measures and updated guidelines for Liberia. This alert provides the latest information to help protect you and your community.</p>
        
        <h2>Understanding New Variants</h2>
        <p>COVID-19 variants are mutations of the original virus. While some variants may spread more easily, our prevention measures remain effective. Key characteristics include:</p>
        <ul>
          <li>Increased transmissibility</li>
          <li>Potential for reduced vaccine effectiveness</li>
          <li>Similar symptoms to original strain</li>
          <li>Importance of continued vigilance</li>
        </ul>
        
        <h2>Prevention Guidelines</h2>
        
        <h3>1. Vaccination</h3>
        <p>Get vaccinated and stay up to date with booster shots. Vaccines remain the most effective protection against severe illness, hospitalization, and death from COVID-19.</p>
        
        <h3>2. Mask Wearing</h3>
        <p>Wear masks in crowded indoor spaces, healthcare facilities, and when caring for someone with COVID-19. Use well-fitting masks that cover your nose and mouth.</p>
        
        <h3>3. Hand Hygiene</h3>
        <p>Wash hands frequently with soap and water for at least 20 seconds. Use hand sanitizer with at least 60% alcohol when soap and water aren't available.</p>
        
        <h3>4. Physical Distancing</h3>
        <p>Maintain distance from others, especially in poorly ventilated spaces. Avoid large gatherings when possible.</p>
        
        <h3>5. Ventilation</h3>
        <p>Ensure good air circulation in indoor spaces. Open windows and doors when possible to improve ventilation.</p>
        
        <h2>Recognizing Symptoms</h2>
        <p>Common COVID-19 symptoms include:</p>
        <ul>
          <li>Fever or chills</li>
          <li>Cough</li>
          <li>Shortness of breath or difficulty breathing</li>
          <li>Fatigue</li>
          <li>Muscle or body aches</li>
          <li>Headache</li>
          <li>Loss of taste or smell</li>
          <li>Sore throat</li>
          <li>Congestion or runny nose</li>
          <li>Nausea or vomiting</li>
          <li>Diarrhea</li>
        </ul>
        
        <h2>When to Seek Medical Care</h2>
        <p>Seek immediate medical attention if you experience:</p>
        <ul>
          <li>Difficulty breathing</li>
          <li>Persistent chest pain or pressure</li>
          <li>Confusion or inability to stay awake</li>
          <li>Bluish lips or face</li>
        </ul>
        
        <h2>Testing and Isolation</h2>
        <p>If you have symptoms or have been exposed to COVID-19:</p>
        <ul>
          <li>Get tested as soon as possible</li>
          <li>Isolate from others until you receive results</li>
          <li>If positive, isolate for at least 5 days</li>
          <li>Wear a mask when around others for 10 days</li>
        </ul>
        
        <h2>Treatment Options</h2>
        <p>Several treatments are available for COVID-19, especially for those at high risk of severe illness. Consult with healthcare providers through MedConsult Liberia to discuss treatment options if you test positive.</p>
        
        <h2>Protecting Vulnerable Populations</h2>
        <p>Take extra precautions to protect:</p>
        <ul>
          <li>Elderly individuals</li>
          <li>People with underlying health conditions</li>
          <li>Immunocompromised individuals</li>
          <li>Pregnant women</li>
        </ul>
        
        <h2>Stay Informed</h2>
        <p>Follow updates from the Ministry of Health and WHO. Guidelines may change as we learn more about new variants. MedConsult Liberia provides up-to-date information and consultations for COVID-19 concerns.</p>
        
        <p><strong>Remember: We can protect ourselves and our communities by staying informed and following prevention guidelines. If you have concerns about COVID-19, consult with our healthcare professionals immediately.</strong></p>
      `
    },
    {
      id: '5',
      title: 'Ebola Preparedness: What You Need to Know',
      excerpt: 'Essential information on Ebola prevention, symptoms, and emergency response protocols.',
      category: 'Disease Outbreak',
      author: 'Isaac B. Zeah, PA',
      date: '2024-11-18',
      content: `
        <h2>Understanding Ebola Virus Disease</h2>
        <p>Ebola is a severe, often fatal illness in humans caused by the Ebola virus. Given Liberia's history with Ebola outbreaks, preparedness and awareness are crucial for protecting our communities.</p>
        
        <h2>How Ebola Spreads</h2>
        <p>Ebola is transmitted through:</p>
        <ul>
          <li>Direct contact with blood or body fluids of infected people</li>
          <li>Contact with objects contaminated with body fluids</li>
          <li>Contact with infected animals (bushmeat)</li>
          <li>Caring for sick patients without proper protection</li>
          <li>Unsafe burial practices</li>
        </ul>
        <p><strong>Important:</strong> Ebola is NOT spread through air, water, or food (except bushmeat from infected animals).</p>
        
        <h2>Recognizing Symptoms</h2>
        <p>Symptoms typically appear 2-21 days after exposure:</p>
        
        <h3>Early Symptoms</h3>
        <ul>
          <li>Sudden fever</li>
          <li>Severe headache</li>
          <li>Muscle pain</li>
          <li>Weakness and fatigue</li>
          <li>Sore throat</li>
        </ul>
        
        <h3>Later Symptoms</h3>
        <ul>
          <li>Vomiting and diarrhea</li>
          <li>Rash</li>
          <li>Impaired kidney and liver function</li>
          <li>Internal and external bleeding</li>
        </ul>
        
        <h2>Prevention Measures</h2>
        
        <h3>1. Avoid Contact with Infected Individuals</h3>
        <p>Do not touch the blood or body fluids of anyone who is sick or has died from Ebola. Only trained healthcare workers with proper protective equipment should provide care.</p>
        
        <h3>2. Practice Safe Burial</h3>
        <p>Do not touch or wash bodies of people who have died from Ebola. Contact trained burial teams immediately.</p>
        
        <h3>3. Avoid Bushmeat</h3>
        <p>Do not handle or consume bushmeat, especially from bats, monkeys, or other wild animals that may carry the virus.</p>
        
        <h3>4. Hand Hygiene</h3>
        <p>Wash hands frequently with soap and water or use alcohol-based hand sanitizer, especially after caring for sick people or visiting healthcare facilities.</p>
        
        <h3>5. Use Personal Protective Equipment (PPE)</h3>
        <p>Healthcare workers and caregivers must wear appropriate PPE including gloves, gowns, masks, and eye protection.</p>
        
        <h2>What to Do If You Suspect Ebola</h2>
        
        <h3>If You Have Symptoms:</h3>
        <ol>
          <li>Isolate yourself immediately from others</li>
          <li>Call the Ebola hotline: 4455 (toll-free)</li>
          <li>Do not go directly to a health facility without calling first</li>
          <li>Inform healthcare workers of your symptoms and travel history</li>
        </ol>
        
        <h3>If Someone in Your Household is Sick:</h3>
        <ol>
          <li>Call the Ebola hotline immediately</li>
          <li>Isolate the sick person in a separate room</li>
          <li>Avoid direct contact with body fluids</li>
          <li>Wear gloves and mask if you must provide care</li>
          <li>Wash hands frequently</li>
        </ol>
        
        <h2>Treatment and Care</h2>
        <p>Early supportive care with rehydration and treatment of symptoms improves survival. Several treatments have been developed:</p>
        <ul>
          <li>Monoclonal antibody treatments</li>
          <li>Intravenous fluids and electrolyte replacement</li>
          <li>Oxygen therapy</li>
          <li>Treatment of complications</li>
        </ul>
        
        <h2>Vaccination</h2>
        <p>An Ebola vaccine (rVSV-ZEBOV) is available and highly effective. Healthcare workers and those at high risk should be vaccinated. Contact health authorities for vaccination information.</p>
        
        <h2>Community Response</h2>
        <p>Controlling Ebola requires community cooperation:</p>
        <ul>
          <li>Report suspected cases immediately</li>
          <li>Support contact tracing efforts</li>
          <li>Follow quarantine guidelines if exposed</li>
          <li>Combat stigma against survivors</li>
          <li>Share accurate information to prevent panic</li>
        </ul>
        
        <h2>Emergency Contacts</h2>
        <p><strong>Ebola Hotline:</strong> 4455 (toll-free)</p>
        <p><strong>Ministry of Health:</strong> +231-XXX-XXXX</p>
        <p><strong>WHO Liberia:</strong> +231-XXX-XXXX</p>
        
        <h2>Stay Vigilant</h2>
        <p>Liberia has successfully contained Ebola outbreaks before through community cooperation and adherence to prevention measures. By staying informed and following guidelines, we can protect ourselves and our communities.</p>
        
        <p><strong>For medical consultation about Ebola concerns or symptoms, contact MedConsult Liberia immediately. Our healthcare professionals are trained to provide guidance and connect you with appropriate care.</strong></p>
      `
    },
    {
      id: '6',
      title: 'Cholera Prevention During Rainy Season',
      excerpt: 'Critical guidelines for preventing cholera outbreaks during Liberia\'s rainy season.',
      category: 'Health Alert',
      author: 'MedConsult Health Team',
      date: '2024-11-12',
      content: `
        <h2>Cholera Risk During Rainy Season</h2>
        <p>Cholera outbreaks are more common during Liberia's rainy season due to flooding, contaminated water sources, and poor sanitation. Understanding prevention measures is essential for protecting your family and community.</p>
        
        <h2>What is Cholera?</h2>
        <p>Cholera is an acute diarrheal infection caused by the bacterium Vibrio cholerae. It spreads through contaminated water and food and can cause severe dehydration and death within hours if untreated.</p>
        
        <h2>How Cholera Spreads</h2>
        <ul>
          <li>Drinking contaminated water</li>
          <li>Eating food washed with contaminated water</li>
          <li>Eating raw or undercooked seafood</li>
          <li>Poor hand hygiene after using the toilet</li>
          <li>Contact with feces of infected persons</li>
        </ul>
        
        <h2>Recognizing Symptoms</h2>
        <p>Symptoms appear within 12 hours to 5 days after infection:</p>
        <ul>
          <li>Sudden onset of watery diarrhea (rice-water stools)</li>
          <li>Vomiting</li>
          <li>Rapid dehydration</li>
          <li>Muscle cramps</li>
          <li>Weakness and fatigue</li>
          <li>Dry mouth and extreme thirst</li>
          <li>Low blood pressure</li>
          <li>Rapid heart rate</li>
        </ul>
        
        <h2>Prevention Strategies</h2>
        
        <h3>1. Safe Water Practices</h3>
        <ul>
          <li>Boil water for at least 1 minute before drinking</li>
          <li>Use water purification tablets if boiling isn't possible</li>
          <li>Store clean water in covered containers</li>
          <li>Avoid drinking from streams, rivers, or open wells</li>
          <li>Use bottled water when available</li>
        </ul>
        
        <h3>2. Food Safety</h3>
        <ul>
          <li>Cook food thoroughly, especially seafood</li>
          <li>Eat food while it's hot</li>
          <li>Wash fruits and vegetables with safe water</li>
          <li>Avoid raw or undercooked food</li>
          <li>Peel fruits yourself</li>
          <li>Avoid street food during outbreaks</li>
        </ul>
        
        <h3>3. Hand Hygiene</h3>
        <ul>
          <li>Wash hands with soap and safe water frequently</li>
          <li>Always wash hands after using the toilet</li>
          <li>Wash hands before preparing or eating food</li>
          <li>Use hand sanitizer when soap and water aren't available</li>
        </ul>
        
        <h3>4. Sanitation</h3>
        <ul>
          <li>Use latrines or toilets for defecation</li>
          <li>Keep latrines clean and covered</li>
          <li>Dispose of waste properly</li>
          <li>Avoid open defecation</li>
          <li>Keep living areas clean and dry</li>
        </ul>
        
        <h3>5. During Flooding</h3>
        <ul>
          <li>Avoid contact with floodwater</li>
          <li>Protect water sources from contamination</li>
          <li>Ensure proper drainage around your home</li>
          <li>Disinfect wells and water sources after flooding</li>
        </ul>
        
        <h2>Treatment</h2>
        <p>Cholera is treatable with prompt care:</p>
        
        <h3>Oral Rehydration Solution (ORS)</h3>
        <p>Most cholera patients can be treated with ORS. Mix ORS packets with safe water according to instructions and drink frequently.</p>
        
        <h3>Intravenous Fluids</h3>
        <p>Severe cases require IV fluids for rapid rehydration. Seek medical care immediately if you or someone shows signs of severe dehydration.</p>
        
        <h3>Antibiotics</h3>
        <p>Antibiotics can reduce the duration and severity of cholera. Healthcare providers will prescribe appropriate antibiotics.</p>
        
        <h2>When to Seek Medical Care</h2>
        <p>Seek immediate medical attention if you experience:</p>
        <ul>
          <li>Severe watery diarrhea</li>
          <li>Vomiting</li>
          <li>Signs of dehydration (dry mouth, decreased urination, dizziness)</li>
          <li>Muscle cramps</li>
        </ul>
        
        <h2>Protecting Children</h2>
        <p>Children are especially vulnerable to cholera:</p>
        <ul>
          <li>Ensure they drink only safe water</li>
          <li>Teach proper handwashing</li>
          <li>Monitor for symptoms</li>
          <li>Seek care immediately if they show signs of diarrhea</li>
          <li>Continue breastfeeding infants</li>
        </ul>
        
        <h2>Vaccination</h2>
        <p>Oral cholera vaccines are available and provide protection for up to 2 years. Contact health authorities for vaccination campaigns in your area.</p>
        
        <h2>Community Action</h2>
        <p>Preventing cholera requires community effort:</p>
        <ul>
          <li>Report suspected cases to health authorities</li>
          <li>Participate in community clean-up activities</li>
          <li>Support proper waste management</li>
          <li>Share prevention information with neighbors</li>
          <li>Protect communal water sources</li>
        </ul>
        
        <h2>Emergency Contacts</h2>
        <p>If you suspect cholera, contact:</p>
        <ul>
          <li>Local health facility</li>
          <li>Ministry of Health hotline</li>
          <li>MedConsult Liberia for immediate consultation</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>Cholera is preventable and treatable. By following these guidelines, especially during the rainy season, you can protect yourself and your community. Remember: safe water, proper sanitation, and hand hygiene are your best defenses against cholera.</p>
        
        <p><strong>For medical consultation about cholera symptoms or prevention, contact MedConsult Liberia. Our healthcare professionals are available 24/7 to provide guidance and care.</strong></p>
      `
    },
    {
      id: '7',
      title: 'WHO Approves New Malaria Vaccine for Children',
      excerpt: 'World Health Organization endorses groundbreaking malaria vaccine, offering hope for millions of children in Africa.',
      category: 'Global Health',
      author: 'MedConsult Health Team',
      date: '2024-11-22',
      content: `
        <h2>Historic Milestone in Malaria Prevention</h2>
        <p>The World Health Organization has approved a new malaria vaccine specifically designed for children, marking a significant breakthrough in the fight against one of Africa's deadliest diseases.</p>
        
        <h2>About the Vaccine</h2>
        <p>The newly approved vaccine, R21/Matrix-M, has shown remarkable efficacy in clinical trials conducted across several African countries, including regions with high malaria transmission rates similar to Liberia.</p>
        
        <h3>Key Features</h3>
        <ul>
          <li>Up to 75% efficacy in preventing malaria in children</li>
          <li>Requires 4 doses over 18 months</li>
          <li>Cost-effective and scalable for mass distribution</li>
          <li>Safe with minimal side effects</li>
        </ul>
        
        <h2>Impact on Liberia</h2>
        <p>Malaria remains a leading cause of illness and death in Liberia, particularly among children under five. This vaccine could significantly reduce:</p>
        <ul>
          <li>Childhood mortality rates</li>
          <li>Hospital admissions for severe malaria</li>
          <li>Economic burden on families</li>
          <li>School absenteeism due to illness</li>
        </ul>
        
        <h2>Rollout Plans</h2>
        <p>The Ministry of Health is working with WHO and partners to develop a distribution strategy. Initial rollout is expected to prioritize:</p>
        <ul>
          <li>High-transmission areas</li>
          <li>Children aged 5 months to 3 years</li>
          <li>Integration with existing immunization programs</li>
          <li>Community health worker training</li>
        </ul>
        
        <h2>Complementary Prevention</h2>
        <p>While the vaccine is a major advancement, it should be used alongside existing prevention methods:</p>
        <ul>
          <li>Insecticide-treated bed nets</li>
          <li>Indoor residual spraying</li>
          <li>Prompt diagnosis and treatment</li>
          <li>Environmental management</li>
        </ul>
        
        <h2>What Parents Should Know</h2>
        <p>Parents should continue current malaria prevention practices while awaiting vaccine availability. When the vaccine becomes available in Liberia:</p>
        <ul>
          <li>It will be provided through health facilities</li>
          <li>Healthcare workers will provide guidance on scheduling</li>
          <li>The vaccine is free as part of national immunization programs</li>
          <li>All four doses are necessary for full protection</li>
        </ul>
        
        <h2>Looking Forward</h2>
        <p>This vaccine represents hope for millions of African children. Combined with other prevention strategies, it could dramatically reduce malaria's impact on Liberian families and communities.</p>
        
        <p><strong>For more information about malaria prevention and the upcoming vaccine program, consult with MedConsult Liberia's healthcare professionals.</strong></p>
      `
    },
    {
      id: '8',
      title: 'Liberia Launches National Health Insurance Scheme',
      excerpt: 'Government of Liberia introduces comprehensive health insurance program to improve healthcare access for all citizens.',
      category: 'Liberia News',
      author: 'MedConsult Team',
      date: '2024-11-21',
      content: `
        <h2>A New Era for Healthcare in Liberia</h2>
        <p>The Government of Liberia has officially launched the National Health Insurance Scheme (NHIS), a comprehensive program designed to make quality healthcare accessible and affordable for all Liberians.</p>
        
        <h2>What is the NHIS?</h2>
        <p>The National Health Insurance Scheme is a government-backed program that provides health coverage to Liberian citizens, reducing out-of-pocket healthcare expenses and ensuring access to essential medical services.</p>
        
        <h2>Coverage Benefits</h2>
        <p>The NHIS covers a wide range of healthcare services:</p>
        
        <h3>Primary Care</h3>
        <ul>
          <li>General consultations</li>
          <li>Preventive care and screenings</li>
          <li>Vaccinations</li>
          <li>Basic diagnostic tests</li>
        </ul>
        
        <h3>Specialized Care</h3>
        <ul>
          <li>Specialist consultations</li>
          <li>Surgical procedures</li>
          <li>Maternity and childbirth services</li>
          <li>Chronic disease management</li>
        </ul>
        
        <h3>Medications</h3>
        <ul>
          <li>Essential medicines</li>
          <li>Chronic disease medications</li>
          <li>Emergency medications</li>
        </ul>
        
        <h3>Emergency Services</h3>
        <ul>
          <li>Emergency room visits</li>
          <li>Ambulance services</li>
          <li>Emergency surgeries</li>
        </ul>
        
        <h2>Enrollment Process</h2>
        <p>Citizens can enroll through multiple channels:</p>
        <ol>
          <li><strong>Online Registration:</strong> Visit the NHIS website to register</li>
          <li><strong>Health Facilities:</strong> Enroll at participating hospitals and clinics</li>
          <li><strong>Community Centers:</strong> Registration available at county health offices</li>
          <li><strong>Mobile Registration:</strong> Teams visiting communities for enrollment</li>
        </ol>
        
        <h2>Premium Structure</h2>
        <p>The NHIS uses a tiered premium system based on income levels:</p>
        <ul>
          <li><strong>Low-income families:</strong> Subsidized or free coverage</li>
          <li><strong>Middle-income earners:</strong> Affordable monthly premiums</li>
          <li><strong>High-income earners:</strong> Standard premium rates</li>
          <li><strong>Vulnerable groups:</strong> Free coverage (elderly, disabled, children under 5)</li>
        </ul>
        
        <h2>Participating Facilities</h2>
        <p>The NHIS has partnered with healthcare facilities across all 15 counties, including:</p>
        <ul>
          <li>Government hospitals</li>
          <li>Private hospitals and clinics</li>
          <li>Community health centers</li>
          <li>Telemedicine services like MedConsult Liberia</li>
        </ul>
        
        <h2>Impact on Healthcare Access</h2>
        <p>The NHIS is expected to:</p>
        <ul>
          <li>Reduce financial barriers to healthcare</li>
          <li>Improve health outcomes nationwide</li>
          <li>Decrease preventable deaths</li>
          <li>Strengthen the healthcare system</li>
          <li>Promote preventive care</li>
        </ul>
        
        <h2>MedConsult Liberia Partnership</h2>
        <p>MedConsult Liberia is proud to be a participating provider in the NHIS. Enrolled members can access our telemedicine services as part of their coverage, making quality healthcare even more accessible.</p>
        
        <h2>How to Get Started</h2>
        <p>To enroll in the NHIS:</p>
        <ol>
          <li>Gather required documents (ID, proof of residence)</li>
          <li>Choose your enrollment method</li>
          <li>Complete the registration form</li>
          <li>Select your premium tier</li>
          <li>Receive your NHIS card</li>
        </ol>
        
        <p><strong>For assistance with NHIS enrollment or to learn how to use your insurance with MedConsult Liberia, contact our support team today.</strong></p>
      `
    },
    {
      id: '9',
      title: 'New Maternal Health Initiative in Montserrado County',
      excerpt: 'UNICEF partners with local health facilities to reduce maternal mortality rates through improved prenatal care.',
      category: 'Liberia News',
      author: 'MedConsult Health Team',
      date: '2024-11-19',
      content: `
        <h2>Improving Maternal Health Outcomes</h2>
        <p>UNICEF, in partnership with the Ministry of Health and local health facilities, has launched a comprehensive maternal health initiative in Montserrado County aimed at reducing maternal mortality and improving prenatal care.</p>
        
        <h2>The Challenge</h2>
        <p>Liberia faces significant challenges in maternal health:</p>
        <ul>
          <li>High maternal mortality rates</li>
          <li>Limited access to prenatal care in rural areas</li>
          <li>Shortage of skilled birth attendants</li>
          <li>Delayed emergency obstetric care</li>
        </ul>
        
        <h2>Initiative Components</h2>
        
        <h3>1. Enhanced Prenatal Care</h3>
        <p>The program provides comprehensive prenatal services including:</p>
        <ul>
          <li>Regular health check-ups throughout pregnancy</li>
          <li>Nutritional counseling and supplements</li>
          <li>Screening for pregnancy complications</li>
          <li>HIV and malaria prevention</li>
          <li>Birth preparedness planning</li>
        </ul>
        
        <h3>2. Skilled Birth Attendance</h3>
        <ul>
          <li>Training for midwives and nurses</li>
          <li>Equipment and supplies for safe deliveries</li>
          <li>24/7 maternity services at participating facilities</li>
          <li>Emergency obstetric care capabilities</li>
        </ul>
        
        <h3>3. Community Health Workers</h3>
        <ul>
          <li>Home visits for pregnant women</li>
          <li>Health education on maternal nutrition</li>
          <li>Identification of high-risk pregnancies</li>
          <li>Referral to health facilities when needed</li>
        </ul>
        
        <h3>4. Emergency Transport</h3>
        <ul>
          <li>Ambulance services for obstetric emergencies</li>
          <li>Referral system to higher-level facilities</li>
          <li>Communication network for emergency coordination</li>
        </ul>
        
        <h2>Participating Facilities</h2>
        <p>The initiative includes major health facilities in Montserrado County:</p>
        <ul>
          <li>John F. Kennedy Medical Center</li>
          <li>Redemption Hospital</li>
          <li>ELWA Hospital</li>
          <li>Community health centers across the county</li>
        </ul>
        
        <h2>Free Services</h2>
        <p>All pregnant women in Montserrado County can access:</p>
        <ul>
          <li>Free prenatal consultations</li>
          <li>Free delivery services</li>
          <li>Free postnatal care</li>
          <li>Free emergency obstetric care</li>
          <li>Free nutritional supplements</li>
        </ul>
        
        <h2>What Pregnant Women Should Do</h2>
        <ol>
          <li><strong>Register Early:</strong> Visit a health facility as soon as you know you're pregnant</li>
          <li><strong>Attend All Appointments:</strong> Don't miss prenatal check-ups</li>
          <li><strong>Follow Medical Advice:</strong> Take prescribed supplements and medications</li>
          <li><strong>Plan for Delivery:</strong> Identify where you'll deliver and how you'll get there</li>
          <li><strong>Know Warning Signs:</strong> Learn symptoms that require immediate care</li>
        </ol>
        
        <h2>Warning Signs During Pregnancy</h2>
        <p>Seek immediate medical attention if you experience:</p>
        <ul>
          <li>Severe headache or blurred vision</li>
          <li>Vaginal bleeding</li>
          <li>Severe abdominal pain</li>
          <li>Fever</li>
          <li>Reduced fetal movement</li>
          <li>Swelling of face and hands</li>
          <li>Difficulty breathing</li>
        </ul>
        
        <h2>Telemedicine Support</h2>
        <p>MedConsult Liberia supports this initiative by providing:</p>
        <ul>
          <li>Remote prenatal consultations</li>
          <li>24/7 advice for pregnancy concerns</li>
          <li>Guidance on when to visit a facility</li>
          <li>Postnatal care support</li>
        </ul>
        
        <h2>Expected Impact</h2>
        <p>The initiative aims to:</p>
        <ul>
          <li>Reduce maternal deaths by 40% in Montserrado County</li>
          <li>Increase facility-based deliveries</li>
          <li>Improve early detection of complications</li>
          <li>Enhance quality of maternal care</li>
        </ul>
        
        <p><strong>For prenatal consultations or pregnancy-related concerns, contact MedConsult Liberia. Our healthcare professionals are available to support you throughout your pregnancy journey.</strong></p>
      `
    },
    {
      id: '1',
      title: '10 Essential Health Tips for Liberians',
      excerpt: 'Discover practical health tips to maintain wellness in Liberia\'s climate and environment.',
      category: 'Health Tips',
      author: 'MedConsult Team',
      date: '2024-11-15',
      content: `
        <h2>Introduction</h2>
        <p>Maintaining good health in Liberia's tropical climate requires understanding the unique challenges and opportunities our environment presents. Here are 10 essential health tips every Liberian should know.</p>
        
        <h2>1. Stay Hydrated</h2>
        <p>In our warm climate, it's crucial to drink plenty of clean water throughout the day. Aim for at least 8 glasses of water daily, and more if you're physically active or spending time outdoors.</p>
        
        <h2>2. Practice Good Hygiene</h2>
        <p>Regular handwashing with soap and clean water is one of the most effective ways to prevent disease transmission. Wash your hands before eating, after using the restroom, and when returning home.</p>
        
        <h2>3. Use Mosquito Protection</h2>
        <p>Protect yourself from mosquito-borne diseases like malaria by using insecticide-treated bed nets, wearing long sleeves during peak mosquito hours, and using mosquito repellent.</p>
        
        <h2>4. Eat a Balanced Diet</h2>
        <p>Include a variety of local fruits, vegetables, proteins, and whole grains in your diet. Foods like cassava leaves, palm oil, fish, and tropical fruits provide essential nutrients.</p>
        
        <h2>5. Get Regular Exercise</h2>
        <p>Physical activity is important for maintaining a healthy weight and preventing chronic diseases. Even 30 minutes of walking daily can make a significant difference.</p>
        
        <h2>6. Seek Medical Care Early</h2>
        <p>Don't wait until symptoms become severe. Early consultation with healthcare providers through services like MedConsult Liberia can prevent complications and ensure better outcomes.</p>
        
        <h2>7. Keep Your Environment Clean</h2>
        <p>Proper waste disposal and maintaining clean living spaces help prevent the spread of diseases. Ensure proper drainage around your home to reduce mosquito breeding sites.</p>
        
        <h2>8. Get Vaccinated</h2>
        <p>Stay up to date with recommended vaccinations for you and your family. Vaccines protect against serious diseases and are an important part of preventive healthcare.</p>
        
        <h2>9. Manage Stress</h2>
        <p>Mental health is as important as physical health. Take time to relax, connect with family and friends, and seek support when needed.</p>
        
        <h2>10. Regular Health Check-ups</h2>
        <p>Even when you feel healthy, regular check-ups can help detect potential health issues early. Use telemedicine services for convenient access to healthcare professionals.</p>
        
        <h2>Conclusion</h2>
        <p>By following these essential health tips, you can maintain better health and well-being. Remember, MedConsult Liberia is here to support your healthcare journey with accessible, quality medical consultations.</p>
      `
    },
    {
      id: '2',
      title: 'Understanding Malaria Prevention',
      excerpt: 'Learn about effective malaria prevention strategies and treatment options available in Liberia.',
      category: 'Medical Insights',
      author: 'Isaac B. Zeah, PA',
      date: '2024-11-10',
      content: `
        <h2>Introduction</h2>
        <p>Malaria remains one of the most significant health challenges in Liberia. Understanding how to prevent and treat this disease is crucial for protecting yourself and your family.</p>
        
        <h2>What is Malaria?</h2>
        <p>Malaria is a life-threatening disease caused by parasites transmitted through the bites of infected female Anopheles mosquitoes. In Liberia, malaria is endemic, meaning it occurs year-round with seasonal variations.</p>
        
        <h2>Prevention Strategies</h2>
        
        <h3>1. Insecticide-Treated Bed Nets (ITNs)</h3>
        <p>Sleeping under an insecticide-treated bed net is one of the most effective ways to prevent malaria. These nets create a physical barrier and kill mosquitoes that come into contact with them.</p>
        
        <h3>2. Indoor Residual Spraying (IRS)</h3>
        <p>IRS involves applying insecticides to the walls and ceilings of homes. This kills mosquitoes that rest on these surfaces after feeding.</p>
        
        <h3>3. Environmental Management</h3>
        <p>Eliminate mosquito breeding sites by removing standing water around your home. This includes emptying containers, cleaning gutters, and ensuring proper drainage.</p>
        
        <h3>4. Personal Protection</h3>
        <p>Use mosquito repellents, wear long-sleeved clothing, and avoid outdoor activities during peak mosquito hours (dusk and dawn).</p>
        
        <h2>Recognizing Symptoms</h2>
        <p>Common malaria symptoms include:</p>
        <ul>
          <li>High fever</li>
          <li>Chills and sweating</li>
          <li>Headache</li>
          <li>Body aches</li>
          <li>Fatigue</li>
          <li>Nausea and vomiting</li>
        </ul>
        
        <h2>Treatment Options</h2>
        <p>If you suspect malaria, seek medical attention immediately. Artemisinin-based combination therapies (ACTs) are the recommended treatment for uncomplicated malaria in Liberia. Early diagnosis and treatment are crucial for preventing severe complications.</p>
        
        <h2>Special Considerations</h2>
        
        <h3>Pregnant Women</h3>
        <p>Pregnant women are at higher risk for severe malaria. They should attend antenatal care regularly and take intermittent preventive treatment (IPTp) as recommended.</p>
        
        <h3>Children</h3>
        <p>Children under five are particularly vulnerable to malaria. Ensure they sleep under bed nets and seek immediate care if they show symptoms.</p>
        
        <h2>Conclusion</h2>
        <p>Malaria prevention requires a combination of personal protection, environmental management, and prompt treatment. Through MedConsult Liberia, you can quickly consult with healthcare professionals about malaria symptoms and receive guidance on appropriate care.</p>
      `
    },
    {
      id: '3',
      title: 'MedConsult Liberia Expands Services',
      excerpt: 'We\'re excited to announce new consultation services and partnerships across Liberia.',
      category: 'Company News',
      author: 'MedConsult Team',
      date: '2024-11-05',
      content: `
        <h2>Exciting News for Healthcare in Liberia</h2>
        <p>We are thrilled to announce significant expansions to MedConsult Liberia's services, making quality healthcare more accessible to people across the country.</p>
        
        <h2>New Services</h2>
        
        <h3>Expanded Specialty Consultations</h3>
        <p>We've added several new medical specialties to our platform, including:</p>
        <ul>
          <li>Pediatrics - specialized care for children</li>
          <li>Obstetrics and Gynecology - women's health services</li>
          <li>Mental Health - counseling and psychiatric consultations</li>
          <li>Dermatology - skin condition consultations</li>
          <li>Cardiology - heart health consultations</li>
        </ul>
        
        <h3>24/7 Emergency Consultations</h3>
        <p>Our emergency consultation service is now available around the clock, ensuring you can get medical advice whenever you need it most.</p>
        
        <h3>Prescription Services</h3>
        <p>Consultants can now provide digital prescriptions that can be filled at partner pharmacies across Liberia, making it easier to get the medications you need.</p>
        
        <h2>New Partnerships</h2>
        
        <h3>Hospital Network</h3>
        <p>We've partnered with leading hospitals in Monrovia, Gbarnga, and Buchanan to provide seamless referrals when in-person care is needed.</p>
        
        <h3>Pharmacy Network</h3>
        <p>Our growing network of partner pharmacies now includes locations in all 15 counties, making it easier to access prescribed medications.</p>
        
        <h3>Insurance Providers</h3>
        <p>We're working with insurance companies to make our services covered under health insurance plans, reducing out-of-pocket costs for patients.</p>
        
        <h2>Technology Improvements</h2>
        
        <h3>Mobile App Launch</h3>
        <p>Our new mobile app for iOS and Android makes it even easier to book consultations, view medical records, and communicate with healthcare providers.</p>
        
        <h3>Enhanced Video Quality</h3>
        <p>We've upgraded our video consultation platform to provide clearer, more reliable connections, even in areas with limited internet connectivity.</p>
        
        <h3>Medical Records System</h3>
        <p>Patients now have access to a secure digital medical records system, allowing you to track your health history and share information with providers.</p>
        
        <h2>Community Impact</h2>
        <p>Since our launch, we've:</p>
        <ul>
          <li>Completed over 10,000 consultations</li>
          <li>Served patients in all 15 counties</li>
          <li>Reduced average wait time for medical consultations from days to minutes</li>
          <li>Provided employment for over 50 healthcare professionals</li>
        </ul>
        
        <h2>Looking Ahead</h2>
        <p>This is just the beginning. We're committed to continuously improving and expanding our services to meet the healthcare needs of all Liberians. Our vision is a Liberia where everyone has access to quality, affordable healthcare, regardless of their location.</p>
        
        <h2>Get Started Today</h2>
        <p>Experience our expanded services by booking a consultation today. Whether you need a routine check-up, specialist advice, or emergency care, MedConsult Liberia is here for you.</p>
        
        <p><strong>Thank you for trusting us with your healthcare needs. Together, we're building a healthier Liberia.</strong></p>
      `
    }
  ];

  const post = posts.find(p => p.id === postId);

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/blog')}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft size={20} />
              Back to Blog
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => router.push('/blog')}
              className="flex items-center gap-2 text-emerald-100 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Blog
            </button>
            <span className="inline-block px-3 py-1 bg-emerald-500 rounded-full text-sm font-semibold mb-4">
              {post.category}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{post.title}</h1>
            <div className="flex items-center gap-6 text-emerald-100">
              <span className="flex items-center gap-2">
                <User size={18} />
                {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={18} />
                {new Date(post.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-96 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center">
              <BookOpen className="text-white" size={120} />
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <article className="bg-white rounded-xl shadow-lg p-8 md:p-12">
              <div 
                className="prose prose-lg max-w-none
                  prose-headings:text-gray-900 prose-headings:font-bold
                  prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                  prose-li:text-gray-700 prose-li:mb-2
                  prose-strong:text-gray-900 prose-strong:font-semibold"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>

            {/* Call to Action */}
            <div className="mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">Need Medical Consultation?</h3>
              <p className="text-emerald-100 mb-6">
                Connect with qualified healthcare professionals through MedConsult Liberia
              </p>
              <button
                onClick={() => router.push('/book-consultation')}
                className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
              >
                Book a Consultation
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
