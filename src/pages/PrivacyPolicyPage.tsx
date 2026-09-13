import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PrivacyPolicyPage = () => {
    const { t } = useTranslation();
    const isArabic = t('common.locale') === 'ar';

    const appPrivacyAddendum = isArabic
        ? {
            socialTitle: 'تسجيل الدخول عبر Google أو Apple',
            socialIntro: 'إذا اخترت تسجيل الدخول أو إنشاء حساب باستخدام Google أو Apple، فإننا نتلقى معلومات ملف شخصي محدودة من ذلك المزود بعد موافقتك على شاشة الإذن الخاصة به:',
            socialItems: [
                'من Google: اسمك وعنوان بريدك الإلكتروني ولغتك المفضلة وصورة ملفك الشخصي.',
                'من Apple: اسمك وعنوان بريدك الإلكتروني (أو عنوان البريد الخاص المخفي من Apple إذا اخترت إخفاء بريدك).',
                'نستخدم هذه المعلومات فقط لإنشاء حسابك في Mintcom وتسجيل دخولك إليه وتحديث ملفك الشخصي والتواصل معك بشأن الخدمة. لا نتلقى كلمة مرور حسابك في Google أو Apple، ولا نحصل على أي وصول إلى جهات اتصالك أو ملفاتك أو أي بيانات أخرى في تلك الحسابات.',
                'لا نستخدم هذه المعلومات للإعلانات ولا نبيعها. يمكنك حذفها في أي وقت عبر حذف حسابك (انظر قسم الاحتفاظ بالبيانات وحذف الحساب أدناه).'
            ],
            permissionsTitle: 'إفصاحات تطبيق الهاتف والأذونات',
            permissionsIntro: 'لضمان قبول سياسة الخصوصية في متجري App Store وGoogle Play، نوضح أيضاً كيف يستخدم تطبيق Mintcom على الهاتف خصائص الجهاز والخدمات المرتبطة به.',
            permissions: [
                'Bluetooth: يُستخدم فقط لاكتشاف الطابعات الحرارية الخارجية وربطها والاتصال بها. لا نستخدم البلوتوث لتتبع الموقع.',
                'Camera: تُستخدم لمسح رموز QR لإعداد الخادم، ومسح الباركود لإضافة المنتجات إلى السلة، والتقاط صور لعناصر القائمة عند اختيارك لذلك.',
                'Photos & Media: تُستخدم فقط عندما تختار رفع صورة موجودة على جهازك لمنتج أو عنصر قائمة أو شعار النشاط.',
                'Local Network: تُستخدم لاكتشاف طابعات الإيصالات أو المطبخ والاتصال بها داخل شبكتك المحلية.',
                'Local Storage: يُستخدم لتخزين الإعدادات والبيانات المؤقتة والسجلات المؤقتة لتحسين الأداء أثناء ضعف الاتصال.',
                'Images You Provide: قد نخزن الصور التي ترفعها أو تلتقطها داخل التطبيق لاستخدامها كصور منتجات أو شعارات أو عناصر قائمة.',
                'Biometric Authentication (Face ID/Touch ID/Fingerprint): يُستخدم فقط لفتح التطبيق وتسجيل دخولك على جهازك. تُعالَج بيانات السمات الحيوية داخل الأجهزة الآمنة في جهازك ولا تغادره مطلقاً، ولا نقوم بإرسالها أو تخزينها لدينا.',
                'Push Notifications: بعد إذنك، نُسجّل رمز إشعارات للجهاز عبر Google Firebase Cloud Messaging وخدمة إشعارات Apple لإرسال تنبيهات تشغيلية (مثل إشعارات الطلبات والحساب والأمان). يمكنك تعطيل الإشعارات في أي وقت من إعدادات جهازك.'
            ],
            diagnosticsTitle: 'التشخيص والخدمات الخارجية',
            diagnosticsIntro: 'لا نبيع بياناتك الشخصية أو بيانات نشاطك التجاري. عند الحاجة لتشغيل التطبيق وتحسينه، قد نشارك بيانات محدودة مع مزودي الخدمة التاليين:',
            diagnostics: [
                'خادمك الخلفي المرتبط بحسابك أو نشاطك التجاري لمعالجة المبيعات والمخزون والحسابات والتقارير.',
                'معالجو الدفع إذا قمت بتفعيل وسائل الدفع الإلكتروني.',
                'Google Firebase Crashlytics لمعالجة سجلات الأعطال وبيانات التشخيص ومعرّف جهاز بهدف مراقبة الاستقرار وتحسين أداء التطبيق، وليس لتتبعك عبر التطبيقات أو الخدمات.',
                'معالج الاستدلال السحابي للذكاء الاصطناعي، الذي يعالج الأسئلة التي ترسلها إلى المساعد مع بيانات النشاط التجاري اللازمة للإجابة عليها (مثل المبيعات والمنتجات والتقارير). نحن نوجه المعالج لاستخدام هذه البيانات فقط لإنشاء إجابتك لطلبك الحالي. تحتفظ Mintcom بسجلات المحادثات في المنصة لمدة 90 يوماً قبل حذفها تلقائياً وفقاً لسياسة الاحتفاظ لدينا.',
                'خدمات التوليد السحابي الآلي للصور، والتي تتلقى أسماء المنتجات والأوصاف النصية لتوليد صور توضيحية للمنتجات. يُحظر تماماً على المستخدمين تضمين أي بيانات شخصية (مثل أسماء الأفراد أو بيانات الاتصال أو الوجوه) في نصوص توليد الصور.'
            ],
            deletionNote: 'لطلب حذف الحساب والبيانات، أرسل رسالة من البريد الإلكتروني المسجل في حسابك أو أرفق اسم النشاط التجاري مع البريد الإلكتروني أو رقم الهاتف المرتبط بالحساب حتى نتمكن من التحقق من الهوية. بعد التحقق، نحذف أو نخفي هوية البيانات المؤهلة خلال 30 يوماً، مع الاحتفاظ فقط بما يلزم قانونياً أو ضريبياً أو محاسبياً أو أمنياً أو لتسوية النزاعات.',
            rightsTitle: '6. حقوقك',
            rightsIntro: 'بحسب موقعك الجغرافي، قد تكون لديك الحقوق التالية فيما يتعلق ببياناتك الشخصية:',
            rights: [
                'الوصول إلى البيانات الشخصية التي نحتفظ بها عنك والحصول على نسخة منها.',
                'تصحيح المعلومات غير الدقيقة أو غير المكتملة.',
                'طلب حذف بياناتك الشخصية.',
                'تقييد بعض معالجات البيانات أو الاعتراض عليها.',
                'طلب تصدير بياناتك أو نقلها حيثما كان ذلك قابلاً للتطبيق.'
            ],
            rightsOutro: 'لممارسة أي من هذه الحقوق، تواصل معنا عبر',
            rightsLegal: '. وسنرد وفقاً للقانون المعمول به.',
            governingLawTitle: 'القانون الواجب التطبيق',
            governingLawBody: 'تخضع سياسة الخصوصية هذه واستخدامك لخدمات Mintcom لقوانين إنجلترا وويلز، ما لم يفرض القانون المحلي الإلزامي خلاف ذلك.'
        }
        : {
            socialTitle: 'Sign in with Google or Apple',
            socialIntro: 'If you choose to sign in or create an account using Google or Apple, we receive limited profile information from that provider after you approve it on their consent screen:',
            socialItems: [
                'From Google: your name, email address, language preference, and profile picture.',
                'From Apple: your name and email address (or Apple\'s private relay email address if you choose to hide yours).',
                'We use this information only to create and sign you into your Mintcom account, keep your profile up to date, and communicate with you about the service. We never receive your Google or Apple password, and we do not get access to your contacts, files, or any other data in those accounts.',
                'We do not use this information for advertising and we do not sell it. You can remove it at any time by deleting your account (see Data Retention & Account Deletion below).'
            ],
            permissionsTitle: 'Mobile App Disclosures & Permissions',
            permissionsIntro: 'To ensure the policy clearly covers the Mintcom mobile app for App Store and Google Play review, we also explain how the app uses device features and related services.',
            permissions: [
                'Bluetooth: Used only to discover, pair, and connect to external thermal receipt printers. We do not use Bluetooth for location tracking.',
                'Camera: Used to scan QR codes for server configuration, scan barcodes for adding products to the cart, and capture menu-item images when you choose to do so.',
                'Photos & Media: Used only when you choose to upload an existing image from your device for a product, menu item, or business logo.',
                'Local Network: Used to discover and connect to receipt or kitchen printers on your local network.',
                'Local Storage: Used to store settings, cached data, and temporary logs so the app can remain usable during unstable connectivity.',
                'Images You Provide: We may store images you capture or upload in the app for use as product photos, menu-item images, or business logos.',
                'Biometric Authentication (Face ID/Touch ID/Fingerprint): Used only to unlock the app and sign you in on your device. Biometric data is processed by your device\'s secure hardware, never leaves your device, and is never transmitted to or stored by us.',
                'Push Notifications: With your permission, we register a device push token via Google Firebase Cloud Messaging and the Apple Push Notification service to send operational alerts (such as order, account, and security notifications). You can disable notifications at any time in your device settings.'
            ],
            diagnosticsTitle: 'Diagnostics & Third-Party Services',
            diagnosticsIntro: 'We do not sell your personal or business data. Where needed to operate and improve the app, limited data may be shared with the following service providers:',
            diagnostics: [
                'Your backend server instance associated with your business account so sales, inventory, account, and reporting features can function.',
                'Payment processors if you choose to enable electronic payment integrations.',
                'Google Firebase Crashlytics, which processes crash logs, diagnostic data, and a device identifier on our behalf to help us monitor stability and improve app performance, not to track you across apps or services.',
                'Our cloud AI inference processor, which processes the questions you send to the in-app assistant together with the related business data needed to answer them (such as sales, products, and reports). We instruct the processor to use this data solely to generate your answer for that request. Mintcom independently retains in-app conversation threads for 90 days before automated deletion in accordance with our retention schedule.',
                'Automated cloud image synthesis providers, which receive product titles and category descriptions solely to generate illustrative product photos. You must not submit personal data (such as individual names, phone numbers, or identifiable faces) in image generation prompts.'
            ],
            deletionNote: 'For account and data deletion requests, email us from the address registered to your Mintcom account or include your business name together with the email address or phone number associated with the account so we can verify identity. Once verified, we delete or anonymize eligible personal data within 30 days, except where longer retention is required for legal, tax, accounting, billing, security, fraud-prevention, or dispute-resolution purposes.',
            rightsTitle: '6. Your Rights',
            rightsIntro: 'Depending on your location, you may have the following rights regarding your personal data:',
            rights: [
                'Access and receive a copy of the personal data we hold about you.',
                'Correct inaccurate or incomplete information.',
                'Request deletion of your personal data.',
                'Restrict or object to certain processing of your data.',
                'Request export or portability of your data where applicable.'
            ],
            rightsOutro: 'To exercise any of these rights, contact us at',
            rightsLegal: '. We will respond in accordance with applicable law.',
            governingLawTitle: 'Governing Law',
            governingLawBody: 'This Privacy Policy and your use of the Mintcom services are governed by the laws of England and Wales, unless mandatory local law requires otherwise.'
        };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white font-sans" dir={isArabic ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>{t('metadata.privacy.title')}</title>
                <meta name="description" content={t('metadata.privacy.description')} />
                <meta property="og:title" content={t('metadata.privacy.title')} />
                <meta property="og:description" content={t('metadata.privacy.description')} />
            </Helmet>
            <Navbar hideCommercialLinks />

            {/* Header */}
            <div className="pt-32 pb-16 px-6 bg-gray-50 dark:bg-black/20">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-mintcom-green/10 flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8 text-mintcom-green" />
                        </div>
                        <h1 className="font-magilio text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{t('legal.privacy.title')}</h1>
                        <p className="label-strong font-sans">
                            {t('legal.privacy.lastUpdated')}: {new Date('2026-09-15').toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                        {t('legal.privacy.intro')}
                    </p>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed mb-12">
                        {t('legal.privacy.agreement')}
                    </p>

                    <div className="space-y-12 text-gray-600 dark:text-gray-300">

                        {/* 1. Information We Collect */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s1')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s1_desc')}</p>

                            <div className={`mb-6 ${isArabic ? 'pr-4 border-r-2' : 'pl-4 border-l-2'} border-mintcom-green/20`}>
                                <h3 className="font-magilio text-lg font-bold text-gray-900 dark:text-white mb-3">{t('legal.privacy.sections.s1_1')}</h3>
                                <p className="text-sm font-medium mb-2">{t('legal.privacy.sections.s1_1_desc')}:</p>
                                <ul className="list-disc pr-5 pl-5 space-y-1 text-sm font-medium">
                                    <li>{t('legal.privacy.fields.fullName')}</li>
                                    <li>{t('legal.privacy.fields.email')}</li>
                                    <li>{t('legal.privacy.fields.phone')}</li>
                                    <li>{t('legal.privacy.fields.businessInfo')}</li>
                                    <li>{t('legal.privacy.fields.credentials')}</li>
                                </ul>
                            </div>

                            <div className={`mb-6 ${isArabic ? 'pr-4 border-r-2' : 'pl-4 border-l-2'} border-mintcom-green/20`}>
                                <h3 className="font-magilio text-lg font-bold text-gray-900 dark:text-white mb-3">{appPrivacyAddendum.socialTitle}</h3>
                                <p className="text-sm font-medium mb-2">{appPrivacyAddendum.socialIntro}</p>
                                <ul className="list-disc pr-5 pl-5 space-y-1 text-sm font-medium">
                                    {appPrivacyAddendum.socialItems.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className={`mb-6 ${isArabic ? 'pr-4 border-r-2' : 'pl-4 border-l-2'} border-mintcom-green/20`}>
                                <h3 className="font-magilio text-lg font-bold text-gray-900 dark:text-white mb-3">{t('legal.privacy.sections.s1_2')}</h3>
                                <p className="text-sm font-medium mb-2">{t('legal.privacy.sections.s1_2_desc')}:</p>
                                <ul className="list-disc pr-5 pl-5 space-y-1 text-sm font-medium mb-4">
                                    <li>{t('legal.privacy.fields.cardDetails')}</li>
                                    <li>{t('legal.privacy.fields.billingAddress')}</li>
                                    <li>{t('legal.privacy.fields.transactionIds')}</li>
                                </ul>
                                <div className="bg-mintcom-green/5 p-4 rounded-xl border border-mintcom-green/20">
                                    <p className="text-xs font-bold text-gray-500">
                                        <span className="text-mintcom-green font-black">{t('common.note')}:</span> {t('legal.privacy.sections.s1_2_note')}
                                    </p>
                                </div>
                            </div>

                            <div className={`mb-6 ${isArabic ? 'pr-4 border-r-2' : 'pl-4 border-l-2'} border-mintcom-green/20`}>
                                <h3 className="font-magilio text-lg font-bold text-gray-900 dark:text-white mb-3">{t('legal.privacy.sections.s1_3')}</h3>
                                <p className="text-sm font-medium mb-2">{t('legal.privacy.sections.s1_3_desc')}:</p>
                                <ul className="list-disc pr-5 pl-5 space-y-1 text-sm font-medium">
                                    <li>{t('legal.privacy.fields.sales')}</li>
                                    <li>{t('legal.privacy.fields.products')}</li>
                                    <li>{t('legal.privacy.fields.staff')}</li>
                                    <li>{t('legal.privacy.fields.loyalty')}</li>
                                    <li>{t('legal.privacy.fields.analytics')}</li>
                                </ul>
                            </div>

                            <div className={`${isArabic ? 'pr-4 border-r-2' : 'pl-4 border-l-2'} border-mintcom-green/20`}>
                                <h3 className="font-magilio text-lg font-bold text-gray-900 dark:text-white mb-3">{t('legal.privacy.sections.s1_4')}</h3>
                                <p className="text-sm font-medium mb-2">{t('legal.privacy.sections.s1_4_desc')}:</p>
                                <ul className="list-disc pr-5 pl-5 space-y-1 text-sm font-medium">
                                    <li>{t('legal.privacy.fields.deviceInfo')}</li>
                                    <li>{t('legal.privacy.fields.ipAddress')}</li>
                                    <li>{t('legal.privacy.fields.usageLogs')}</li>
                                    <li>{t('legal.privacy.fields.cookies')}</li>
                                </ul>
                            </div>
                        </section>

                        <section className="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/10">
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{appPrivacyAddendum.permissionsTitle}</h2>
                            <p className="text-sm font-medium mb-4">{appPrivacyAddendum.permissionsIntro}</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium">
                                {appPrivacyAddendum.permissions.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </section>

                        {/* 2. How We Use Your Information */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s2')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s2_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.usage.u1')}</li>
                                <li>{t('legal.privacy.usage.u2')}</li>
                                <li>{t('legal.privacy.usage.u3')}</li>
                                <li>{t('legal.privacy.usage.u4')}</li>
                                <li>{t('legal.privacy.usage.u5')}</li>
                                <li>{t('legal.privacy.usage.u6')}</li>
                                <li>{t('legal.privacy.usage.u7')}</li>
                                <li>{t('legal.privacy.usage.u8')}</li>
                            </ul>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{t('legal.privacy.usage.noSell')}</p>
                        </section>

                        {/* 3. Data Storage & Security */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s3')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s3_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.security.sec1')}</li>
                                <li>{t('legal.privacy.security.sec2')}</li>
                                <li>{t('legal.privacy.security.sec3')}</li>
                                <li>{t('legal.privacy.security.sec4')}</li>
                            </ul>
                            <p className="text-xs font-medium text-gray-500 italic">
                                {t('legal.privacy.security.noAbsoluteSecurity')}
                            </p>
                        </section>

                        {/* 4. Data Sharing & Third Parties */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s4')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s4_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.sharing.sh1')}</li>
                                <li>{t('legal.privacy.sharing.sh2')}</li>
                                <li>{t('legal.privacy.sharing.sh3')}</li>
                            </ul>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.sharing.obligation')}
                            </p>
                            <div className="mt-6 bg-mintcom-green/5 p-5 rounded-2xl border border-mintcom-green/20">
                                <h3 className="font-magilio text-lg font-bold text-gray-900 dark:text-white mb-3">{appPrivacyAddendum.diagnosticsTitle}</h3>
                                <p className="text-sm font-medium mb-4">{appPrivacyAddendum.diagnosticsIntro}</p>
                                <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium">
                                    {appPrivacyAddendum.diagnostics.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* 5. Multi-Branch & Account Access */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s5')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s5_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium">
                                <li>{t('legal.privacy.branch.b1')}</li>
                                <li>{t('legal.privacy.branch.b2')}</li>
                                <li>{t('legal.privacy.branch.b3')}</li>
                            </ul>
                        </section>

                        {/* 6. Data Retention & Account Deletion */}
                        <section id="account-deletion">
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s6')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s6_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.retention.r1')}</li>
                                <li>{t('legal.privacy.retention.r2')}</li>
                                <li>{t('legal.privacy.retention.r3')}</li>
                                {/* Keep in step with AI_CONVERSATION_RETENTION_DAYS
                                    in mintcom-api (default 90). A retention period
                                    enforced in code but absent from the notice only
                                    solves half the storage-limitation problem. */}
                                <li>{t('legal.privacy.retention.r4')}</li>
                            </ul>
                            <p className="text-sm font-medium">{t('legal.privacy.retention.deletionRequest')}</p>
                            <p className="text-sm font-medium mt-4">{appPrivacyAddendum.deletionNote}</p>
                        </section>

                        {/* Account and Data Deletion Requests */}
                        <section className="bg-mintcom-green/5 p-6 rounded-2xl border border-mintcom-green/20">
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.deletion.title')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.deletion.desc')}</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.deletion.step1')}</li>
                                <li>{t('legal.privacy.deletion.step2')}</li>
                                <li>{t('legal.privacy.deletion.step3')}</li>
                            </ul>
                            <p className="text-sm font-medium mb-3">{t('legal.privacy.deletion.retention')}</p>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.deletion.emailLabel')} <a href="mailto:support@mintcompos.com?subject=Account%20and%20data%20deletion%20request" className="text-mintcom-green hover:underline font-bold">support@mintcompos.com</a>
                            </p>
                        </section>

                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{appPrivacyAddendum.rightsTitle}</h2>
                            <p className="text-sm font-medium mb-4">{appPrivacyAddendum.rightsIntro}</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                {appPrivacyAddendum.rights.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                            <p className="text-sm font-medium">
                                {appPrivacyAddendum.rightsOutro}{' '}
                                <a href="mailto:support@mintcompos.com" className="text-mintcom-green hover:underline font-bold">support@mintcompos.com</a>
                                {appPrivacyAddendum.rightsLegal}
                            </p>
                        </section>

                        {/* 8. Cookies & Tracking Technologies */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s8')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s8_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.cookies.c1')}</li>
                                <li>{t('legal.privacy.cookies.c2')}</li>
                                <li>{t('legal.privacy.cookies.c3')}</li>
                            </ul>
                            <p className="text-sm font-medium">{t('legal.privacy.cookies.manage')}</p>
                        </section>

                        {/* 9. International Operations */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s9')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.international.desc')}
                            </p>
                        </section>

                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{appPrivacyAddendum.governingLawTitle}</h2>
                            <p className="text-sm font-medium">
                                {appPrivacyAddendum.governingLawBody}
                            </p>
                        </section>

                        {/* 10. Children’s Privacy */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s10')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.children.desc')}
                            </p>
                        </section>

                        {/* 11. Changes to This Policy */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s11')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.changes.desc')}
                            </p>
                        </section>

                        {/* 12. Contact Us */}
                        <section className="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                            <h2 className="font-barlow text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s12')}</h2>
                            <p className="text-sm font-medium mb-4">
                                {t('legal.privacy.contact.desc')}
                            </p>
                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                                        <span className="text-gray-900 dark:text-white">Mintcom Ltd</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {isArabic
                                            ? 'مسجلة في إنجلترا وويلز (رقم الشركة [CRN]) • المكتب المسجل: [Office Address] • رقم تسجيل ICO: [ICO Registration Number]'
                                            : 'Registered in England and Wales (Company No. [CRN]) • Registered Office: [Office Address] • ICO Registration: [ICO Registration Number]'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                    <span className={isArabic ? 'ml-2' : 'w-20'}>{t('common.email')}:</span>
                                    <a href="mailto:support@mintcompos.com" className="text-mintcom-green hover:underline">support@mintcompos.com</a>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                    <span className={isArabic ? 'ml-2' : 'w-20'}>{t('common.website')}:</span>
                                    <a href="https://mintcompos.com" target="_blank" rel="noopener noreferrer" className="text-mintcom-green hover:underline">mintcompos.com</a>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <Footer hideCommercialLinks />
        </div>
    );
};
