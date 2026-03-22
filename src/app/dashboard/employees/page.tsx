'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, Edit, Mail, Phone, UserX, Upload, X, FileText, Image, Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

// ─── Kenya bank branch data { branchName → code } ────────────────────────────
type BranchInfo = { name: string; code: string }
const KENYA_BANK_BRANCHES: Record<string, BranchInfo[]> = {
  'KCB Bank': [
    // Nairobi County
    { name: 'Head Office', code: '01001' },
    { name: 'Moi Avenue', code: '01002' },
    { name: 'Tom Mboya', code: '01003' },
    { name: 'Industrial Area', code: '01004' },
    { name: 'Westlands', code: '01043' },
    { name: 'Upperhill', code: '01045' },
    { name: 'Karen', code: '01047' },
    { name: 'Gigiri', code: '01050' },
    { name: 'Ngong Road', code: '01054' },
    { name: 'Thika Road Mall', code: '01055' },
    // Coast Region
    { name: 'Mombasa Digo Road', code: '01010' },
    { name: 'Nyali (Mombasa)', code: '01011' },
    { name: 'Kwale', code: '01012' },
    { name: 'Kilifi', code: '01013' },
    { name: 'Malindi (Kilifi)', code: '01014' },
    { name: 'Hola (Tana River)', code: '01015' },
    { name: 'Lamu', code: '01016' },
    { name: 'Voi (Taita Taveta)', code: '01017' },
    // North Eastern
    { name: 'Garissa', code: '01018' },
    { name: 'Wajir', code: '01019' },
    { name: 'Mandera', code: '01021' },
    // Rift Valley / Northern
    { name: 'Marsabit', code: '01022' },
    { name: 'Isiolo', code: '01023' },
    // Central / Eastern
    { name: 'Meru', code: '01024' },
    { name: 'Chuka (Tharaka Nithi)', code: '01025' },
    { name: 'Embu', code: '01026' },
    { name: 'Kitui', code: '01027' },
    { name: 'Machakos', code: '01028' },
    { name: 'Wote (Makueni)', code: '01029' },
    { name: 'Ol Kalou (Nyandarua)', code: '01031' },
    { name: 'Nyeri', code: '01070' },
    { name: 'Kerugoya (Kirinyaga)', code: '01032' },
    { name: "Murang'a", code: '01033' },
    { name: 'Thika (Kiambu)', code: '01060' },
    { name: 'Ruiru (Kiambu)', code: '01056' },
    { name: 'Kiambu Town', code: '01057' },
    // Rift Valley
    { name: 'Lodwar (Turkana)', code: '01034' },
    { name: 'Kapenguria (West Pokot)', code: '01035' },
    { name: 'Maralal (Samburu)', code: '01036' },
    { name: 'Kitale (Trans Nzoia)', code: '01037' },
    { name: 'Eldoret (Uasin Gishu)', code: '01040' },
    { name: 'Iten (Elgeyo Marakwet)', code: '01038' },
    { name: 'Kapsabet (Nandi)', code: '01039' },
    { name: 'Kabarnet (Baringo)', code: '01041' },
    { name: 'Nanyuki (Laikipia)', code: '01042' },
    { name: 'Nakuru', code: '01020' },
    { name: 'Narok', code: '01044' },
    { name: 'Kajiado', code: '01046' },
    { name: 'Kericho', code: '01048' },
    { name: 'Bomet', code: '01049' },
    // Western
    { name: 'Kakamega', code: '01051' },
    { name: 'Vihiga (Mbale)', code: '01052' },
    { name: 'Bungoma', code: '01053' },
    { name: 'Busia', code: '01058' },
    // Nyanza
    { name: 'Siaya', code: '01059' },
    { name: 'Kisumu', code: '01030' },
    { name: 'Homa Bay', code: '01061' },
    { name: 'Migori', code: '01062' },
    { name: 'Kisii', code: '01063' },
    { name: 'Nyamira', code: '01064' },
  ],
  'Equity Bank': [
    // Nairobi County
    { name: 'Head Office', code: '68001' },
    { name: 'Tom Mboya', code: '68002' },
    { name: 'Westlands', code: '68012' },
    { name: 'Upperhill', code: '68020' },
    { name: 'Karen', code: '68025' },
    { name: 'Gigiri', code: '68030' },
    { name: 'Ruiru (Kiambu)', code: '68036' },
    { name: 'Thika (Kiambu)', code: '68080' },
    { name: 'Kiambu Town', code: '68035' },
    // Coast Region
    { name: 'Mombasa', code: '68040' },
    { name: 'Nyali (Mombasa)', code: '68041' },
    { name: 'Kwale', code: '68042' },
    { name: 'Kilifi', code: '68043' },
    { name: 'Malindi (Kilifi)', code: '68044' },
    { name: 'Hola (Tana River)', code: '68045' },
    { name: 'Lamu', code: '68046' },
    { name: 'Voi (Taita Taveta)', code: '68047' },
    // North Eastern
    { name: 'Garissa', code: '68048' },
    { name: 'Wajir', code: '68049' },
    { name: 'Mandera', code: '68051' },
    // Northern
    { name: 'Marsabit', code: '68052' },
    { name: 'Isiolo', code: '68053' },
    // Central / Eastern
    { name: 'Meru', code: '68054' },
    { name: 'Chuka (Tharaka Nithi)', code: '68055' },
    { name: 'Embu', code: '68056' },
    { name: 'Kitui', code: '68057' },
    { name: 'Machakos', code: '68110' },
    { name: 'Wote (Makueni)', code: '68058' },
    { name: 'Ol Kalou (Nyandarua)', code: '68059' },
    { name: 'Nyeri', code: '68090' },
    { name: 'Kerugoya (Kirinyaga)', code: '68061' },
    { name: "Murang'a", code: '68062' },
    // Rift Valley
    { name: 'Lodwar (Turkana)', code: '68063' },
    { name: 'Kapenguria (West Pokot)', code: '68064' },
    { name: 'Maralal (Samburu)', code: '68065' },
    { name: 'Kitale (Trans Nzoia)', code: '68100' },
    { name: 'Eldoret (Uasin Gishu)', code: '68070' },
    { name: 'Iten (Elgeyo Marakwet)', code: '68066' },
    { name: 'Kapsabet (Nandi)', code: '68067' },
    { name: 'Kabarnet (Baringo)', code: '68068' },
    { name: 'Nanyuki (Laikipia)', code: '68069' },
    { name: 'Nakuru', code: '68060' },
    { name: 'Narok', code: '68071' },
    { name: 'Kajiado', code: '68072' },
    { name: 'Kericho', code: '68073' },
    { name: 'Bomet', code: '68074' },
    // Western
    { name: 'Kakamega', code: '68075' },
    { name: 'Vihiga (Mbale)', code: '68076' },
    { name: 'Bungoma', code: '68077' },
    { name: 'Busia', code: '68078' },
    // Nyanza
    { name: 'Siaya', code: '68079' },
    { name: 'Kisumu', code: '68050' },
    { name: 'Homa Bay', code: '68081' },
    { name: 'Migori', code: '68082' },
    { name: 'Kisii', code: '68083' },
    { name: 'Nyamira', code: '68084' },
  ],
  'Co-operative Bank': [
    // Nairobi County
    { name: 'Head Office', code: '11001' },
    { name: 'University Way', code: '11002' },
    { name: 'Westlands', code: '11010' },
    { name: 'Industrial Area', code: '11015' },
    { name: 'Upperhill', code: '11018' },
    { name: 'Karen', code: '11022' },
    { name: 'Thika (Kiambu)', code: '11080' },
    { name: 'Ruiru (Kiambu)', code: '11024' },
    { name: 'Kiambu Town', code: '11023' },
    // Coast
    { name: 'Mombasa', code: '11040' },
    { name: 'Kwale', code: '11043' },
    { name: 'Kilifi', code: '11041' },
    { name: 'Malindi (Kilifi)', code: '11042' },
    { name: 'Lamu', code: '11044' },
    { name: 'Voi (Taita Taveta)', code: '11045' },
    // North Eastern
    { name: 'Garissa', code: '11046' },
    { name: 'Wajir', code: '11047' },
    { name: 'Mandera', code: '11048' },
    // Northern
    { name: 'Isiolo', code: '11049' },
    { name: 'Marsabit', code: '11079' },
    // Eastern / Central
    { name: 'Meru', code: '11051' },
    { name: 'Chuka (Tharaka Nithi)', code: '11052' },
    { name: 'Embu', code: '11053' },
    { name: 'Kitui', code: '11054' },
    { name: 'Machakos', code: '11055' },
    { name: 'Wote (Makueni)', code: '11056' },
    { name: 'Ol Kalou (Nyandarua)', code: '11057' },
    { name: 'Nyeri', code: '11090' },
    { name: 'Kerugoya (Kirinyaga)', code: '11058' },
    { name: "Murang'a", code: '11059' },
    // Rift Valley
    { name: 'Lodwar (Turkana)', code: '11078' },
    { name: 'Kapenguria (West Pokot)', code: '11080' },
    { name: 'Maralal (Samburu)', code: '11081' },
    { name: 'Kitale (Trans Nzoia)', code: '11061' },
    { name: 'Eldoret (Uasin Gishu)', code: '11070' },
    { name: 'Iten (Elgeyo Marakwet)', code: '11082' },
    { name: 'Kapsabet (Nandi)', code: '11083' },
    { name: 'Kabarnet (Baringo)', code: '11077' },
    { name: 'Nanyuki (Laikipia)', code: '11062' },
    { name: 'Nakuru', code: '11060' },
    { name: 'Narok', code: '11063' },
    { name: 'Kajiado', code: '11064' },
    { name: 'Kericho', code: '11065' },
    { name: 'Bomet', code: '11074' },
    // Western
    { name: 'Kakamega', code: '11066' },
    { name: 'Vihiga (Mbale)', code: '11075' },
    { name: 'Bungoma', code: '11067' },
    { name: 'Busia', code: '11068' },
    // Nyanza
    { name: 'Siaya', code: '11076' },
    { name: 'Kisumu', code: '11050' },
    { name: 'Homa Bay', code: '11069' },
    { name: 'Migori', code: '11071' },
    { name: 'Kisii', code: '11072' },
    { name: 'Nyamira', code: '11073' },
  ],
  'NCBA Bank': [
    // Nairobi County
    { name: 'Head Office', code: '07001' },
    { name: 'Westlands', code: '07010' },
    { name: 'The Oval', code: '07015' },
    { name: 'Karen', code: '07020' },
    { name: 'Gigiri', code: '07025' },
    { name: 'Thika (Kiambu)', code: '07027' },
    { name: 'Kiambu Town', code: '07026' },
    // Coast
    { name: 'Mombasa', code: '07040' },
    { name: 'Malindi (Kilifi)', code: '07041' },
    { name: 'Kilifi', code: '07042' },
    { name: 'Voi (Taita Taveta)', code: '07043' },
    { name: 'Lamu', code: '07044' },
    // North Eastern
    { name: 'Garissa', code: '07045' },
    // Eastern / Central
    { name: 'Meru', code: '07046' },
    { name: 'Embu', code: '07047' },
    { name: 'Machakos', code: '07048' },
    { name: 'Nyeri', code: '07049' },
    { name: "Murang'a", code: '07050' },
    { name: 'Kitui', code: '07051' },
    // Rift Valley
    { name: 'Nakuru', code: '07060' },
    { name: 'Eldoret (Uasin Gishu)', code: '07070' },
    { name: 'Kitale (Trans Nzoia)', code: '07071' },
    { name: 'Nanyuki (Laikipia)', code: '07072' },
    { name: 'Narok', code: '07073' },
    { name: 'Kajiado', code: '07074' },
    { name: 'Kericho', code: '07075' },
    { name: 'Nakuru Town', code: '07076' },
    // Western
    { name: 'Kakamega', code: '07077' },
    { name: 'Bungoma', code: '07078' },
    // Nyanza
    { name: 'Kisumu', code: '07079' },
    { name: 'Kisii', code: '07080' },
    { name: 'Migori', code: '07081' },
  ],
  'Absa Bank': [
    // Nairobi County
    { name: 'Head Office', code: '03001' },
    { name: 'Westlands', code: '03010' },
    { name: 'Upperhill', code: '03015' },
    { name: 'Karen', code: '03020' },
    { name: 'Industrial Area', code: '03025' },
    { name: 'Thika (Kiambu)', code: '03080' },
    { name: 'Kiambu Town', code: '03026' },
    // Coast
    { name: 'Mombasa', code: '03040' },
    { name: 'Malindi (Kilifi)', code: '03041' },
    { name: 'Kilifi', code: '03042' },
    { name: 'Voi (Taita Taveta)', code: '03043' },
    { name: 'Kwale', code: '03044' },
    // North Eastern
    { name: 'Garissa', code: '03045' },
    // Eastern / Central
    { name: 'Meru', code: '03046' },
    { name: 'Embu', code: '03047' },
    { name: 'Machakos', code: '03048' },
    { name: 'Kitui', code: '03049' },
    { name: 'Wote (Makueni)', code: '03050' },
    { name: 'Nyeri', code: '03051' },
    { name: "Murang'a", code: '03052' },
    { name: 'Chuka (Tharaka Nithi)', code: '03053' },
    // Rift Valley
    { name: 'Nakuru', code: '03060' },
    { name: 'Eldoret (Uasin Gishu)', code: '03070' },
    { name: 'Kitale (Trans Nzoia)', code: '03071' },
    { name: 'Nanyuki (Laikipia)', code: '03072' },
    { name: 'Narok', code: '03073' },
    { name: 'Kajiado', code: '03074' },
    { name: 'Kericho', code: '03075' },
    { name: 'Bomet', code: '03076' },
    { name: 'Kabarnet (Baringo)', code: '03077' },
    // Western
    { name: 'Kakamega', code: '03078' },
    { name: 'Bungoma', code: '03079' },
    { name: 'Busia', code: '03081' },
    // Nyanza
    { name: 'Kisumu', code: '03082' },
    { name: 'Kisii', code: '03083' },
    { name: 'Migori', code: '03084' },
    { name: 'Homa Bay', code: '03085' },
  ],
  'Standard Chartered': [
    // Nairobi County
    { name: 'Head Office', code: '02001' },
    { name: 'Westlands', code: '02010' },
    { name: 'Karen', code: '02020' },
    { name: 'Upperhill', code: '02025' },
    { name: 'Gigiri', code: '02030' },
    { name: 'Kiambu Town', code: '02031' },
    { name: 'Thika (Kiambu)', code: '02032' },
    // Coast
    { name: 'Mombasa', code: '02040' },
    { name: 'Malindi (Kilifi)', code: '02041' },
    { name: 'Kilifi', code: '02042' },
    { name: 'Voi (Taita Taveta)', code: '02043' },
    // Eastern / Central
    { name: 'Meru', code: '02044' },
    { name: 'Embu', code: '02045' },
    { name: 'Machakos', code: '02046' },
    { name: 'Nyeri', code: '02047' },
    { name: "Murang'a", code: '02048' },
    { name: 'Nanyuki (Laikipia)', code: '02049' },
    // Rift Valley
    { name: 'Nakuru', code: '02060' },
    { name: 'Eldoret (Uasin Gishu)', code: '02070' },
    { name: 'Kitale (Trans Nzoia)', code: '02071' },
    { name: 'Narok', code: '02072' },
    { name: 'Kajiado', code: '02073' },
    { name: 'Kericho', code: '02074' },
    // Western
    { name: 'Kakamega', code: '02075' },
    { name: 'Bungoma', code: '02076' },
    // Nyanza
    { name: 'Kisumu', code: '02050' },
    { name: 'Kisii', code: '02077' },
    { name: 'Migori', code: '02078' },
  ],
  'DTB Bank': [
    // Nairobi County
    { name: 'Head Office', code: '63001' },
    { name: 'Westlands', code: '63010' },
    { name: 'Industrial Area', code: '63015' },
    { name: 'Upperhill', code: '63020' },
    { name: 'Kiambu Town', code: '63021' },
    { name: 'Thika (Kiambu)', code: '63022' },
    // Coast
    { name: 'Mombasa', code: '63040' },
    { name: 'Malindi (Kilifi)', code: '63041' },
    { name: 'Kilifi', code: '63042' },
    { name: 'Kwale', code: '63043' },
    // North Eastern
    { name: 'Garissa', code: '63044' },
    // Eastern / Central
    { name: 'Meru', code: '63045' },
    { name: 'Embu', code: '63046' },
    { name: 'Machakos', code: '63047' },
    { name: 'Nyeri', code: '63048' },
    // Rift Valley
    { name: 'Nakuru', code: '63060' },
    { name: 'Eldoret (Uasin Gishu)', code: '63070' },
    { name: 'Kitale (Trans Nzoia)', code: '63071' },
    { name: 'Nanyuki (Laikipia)', code: '63072' },
    { name: 'Narok', code: '63073' },
    { name: 'Kajiado', code: '63074' },
    { name: 'Kericho', code: '63075' },
    // Western
    { name: 'Kakamega', code: '63076' },
    { name: 'Bungoma', code: '63077' },
    // Nyanza
    { name: 'Kisumu', code: '63050' },
    { name: 'Kisii', code: '63078' },
  ],
  'Family Bank': [
    // Nairobi County
    { name: 'Head Office', code: '70001' },
    { name: 'Westlands', code: '70010' },
    { name: 'Moi Avenue', code: '70015' },
    { name: 'Thika Road', code: '70020' },
    { name: 'Thika Town (Kiambu)', code: '70080' },
    { name: 'Ruiru (Kiambu)', code: '70022' },
    { name: 'Kiambu Town', code: '70021' },
    // Coast
    { name: 'Mombasa', code: '70040' },
    { name: 'Kwale', code: '70041' },
    { name: 'Kilifi', code: '70042' },
    { name: 'Malindi (Kilifi)', code: '70043' },
    { name: 'Lamu', code: '70044' },
    { name: 'Voi (Taita Taveta)', code: '70045' },
    // North Eastern
    { name: 'Garissa', code: '70046' },
    { name: 'Wajir', code: '70047' },
    // Eastern / Central
    { name: 'Meru', code: '70048' },
    { name: 'Chuka (Tharaka Nithi)', code: '70049' },
    { name: 'Embu', code: '70051' },
    { name: 'Kitui', code: '70052' },
    { name: 'Machakos', code: '70053' },
    { name: 'Wote (Makueni)', code: '70054' },
    { name: 'Ol Kalou (Nyandarua)', code: '70055' },
    { name: 'Nyeri', code: '70090' },
    { name: 'Kerugoya (Kirinyaga)', code: '70056' },
    { name: "Murang'a", code: '70057' },
    // Rift Valley
    { name: 'Kitale (Trans Nzoia)', code: '70058' },
    { name: 'Eldoret (Uasin Gishu)', code: '70070' },
    { name: 'Nanyuki (Laikipia)', code: '70059' },
    { name: 'Nakuru', code: '70060' },
    { name: 'Narok', code: '70061' },
    { name: 'Kajiado', code: '70062' },
    { name: 'Kericho', code: '70063' },
    { name: 'Bomet', code: '70064' },
    { name: 'Kapenguria (West Pokot)', code: '70065' },
    // Western
    { name: 'Kakamega', code: '70066' },
    { name: 'Vihiga (Mbale)', code: '70067' },
    { name: 'Bungoma', code: '70068' },
    { name: 'Busia', code: '70069' },
    // Nyanza
    { name: 'Siaya', code: '70071' },
    { name: 'Kisumu', code: '70050' },
    { name: 'Homa Bay', code: '70072' },
    { name: 'Migori', code: '70073' },
    { name: 'Kisii', code: '70074' },
    { name: 'Nyamira', code: '70075' },
  ],
  'I&M Bank': [
    // Nairobi County
    { name: 'Head Office', code: '57001' },
    { name: 'Westlands', code: '57010' },
    { name: 'Karen', code: '57015' },
    { name: 'Upperhill', code: '57020' },
    { name: 'Riverside', code: '57025' },
    { name: 'Thika (Kiambu)', code: '57026' },
    { name: 'Kiambu Town', code: '57027' },
    // Coast
    { name: 'Mombasa', code: '57040' },
    { name: 'Malindi (Kilifi)', code: '57041' },
    { name: 'Kilifi', code: '57042' },
    // Eastern / Central
    { name: 'Meru', code: '57043' },
    { name: 'Embu', code: '57044' },
    { name: 'Machakos', code: '57045' },
    { name: 'Nyeri', code: '57046' },
    { name: 'Nanyuki (Laikipia)', code: '57047' },
    // Rift Valley
    { name: 'Nakuru', code: '57060' },
    { name: 'Eldoret (Uasin Gishu)', code: '57061' },
    { name: 'Kitale (Trans Nzoia)', code: '57062' },
    { name: 'Narok', code: '57063' },
    { name: 'Kajiado', code: '57064' },
    { name: 'Kericho', code: '57065' },
    // Western
    { name: 'Kakamega', code: '57066' },
    { name: 'Bungoma', code: '57067' },
    // Nyanza
    { name: 'Kisumu', code: '57050' },
    { name: 'Kisii', code: '57068' },
    { name: 'Migori', code: '57069' },
  ],
  'Stanbic Bank': [
    // Nairobi County
    { name: 'Head Office', code: '31001' },
    { name: 'Westlands', code: '31010' },
    { name: 'Chiromo', code: '31015' },
    { name: 'Kiambu Town', code: '31016' },
    { name: 'Thika (Kiambu)', code: '31017' },
    // Coast
    { name: 'Mombasa', code: '31040' },
    { name: 'Malindi (Kilifi)', code: '31041' },
    { name: 'Kilifi', code: '31042' },
    // Eastern / Central
    { name: 'Meru', code: '31043' },
    { name: 'Embu', code: '31044' },
    { name: 'Machakos', code: '31045' },
    { name: 'Nyeri', code: '31046' },
    { name: 'Nanyuki (Laikipia)', code: '31047' },
    // Rift Valley
    { name: 'Nakuru', code: '31060' },
    { name: 'Eldoret (Uasin Gishu)', code: '31061' },
    { name: 'Kitale (Trans Nzoia)', code: '31062' },
    { name: 'Narok', code: '31063' },
    { name: 'Kajiado', code: '31064' },
    { name: 'Kericho', code: '31065' },
    // Western
    { name: 'Kakamega', code: '31066' },
    { name: 'Bungoma', code: '31067' },
    // Nyanza
    { name: 'Kisumu', code: '31050' },
    { name: 'Kisii', code: '31068' },
  ],
  'Prime Bank': [
    // Nairobi County
    { name: 'Head Office', code: '10001' },
    { name: 'Westlands', code: '10010' },
    { name: 'Gigiri', code: '10011' },
    { name: 'Thika (Kiambu)', code: '10012' },
    // Coast
    { name: 'Mombasa', code: '10040' },
    { name: 'Malindi (Kilifi)', code: '10041' },
    // Eastern / Central
    { name: 'Meru', code: '10042' },
    { name: 'Embu', code: '10043' },
    { name: 'Machakos', code: '10044' },
    { name: 'Nyeri', code: '10045' },
    { name: 'Nanyuki (Laikipia)', code: '10046' },
    // Rift Valley
    { name: 'Nakuru', code: '10047' },
    { name: 'Eldoret (Uasin Gishu)', code: '10048' },
    { name: 'Kitale (Trans Nzoia)', code: '10049' },
    { name: 'Kajiado', code: '10050' },
    { name: 'Kericho', code: '10051' },
    // Western / Nyanza
    { name: 'Kakamega', code: '10052' },
    { name: 'Kisumu', code: '10053' },
    { name: 'Kisii', code: '10054' },
  ],
  'Sidian Bank': [
    // Nairobi County
    { name: 'Head Office', code: '66001' },
    { name: 'Westlands', code: '66010' },
    { name: 'Thika (Kiambu)', code: '66020' },
    { name: 'Ruiru (Kiambu)', code: '66021' },
    { name: 'Kiambu Town', code: '66022' },
    // Coast
    { name: 'Mombasa', code: '66040' },
    { name: 'Malindi (Kilifi)', code: '66041' },
    { name: 'Kilifi', code: '66042' },
    // Eastern / Central
    { name: 'Meru', code: '66043' },
    { name: 'Chuka (Tharaka Nithi)', code: '66044' },
    { name: 'Embu', code: '66045' },
    { name: 'Machakos', code: '66046' },
    { name: 'Nyeri', code: '66047' },
    { name: 'Nanyuki (Laikipia)', code: '66048' },
    // Rift Valley
    { name: 'Nakuru', code: '66060' },
    { name: 'Eldoret (Uasin Gishu)', code: '66061' },
    { name: 'Kitale (Trans Nzoia)', code: '66062' },
    { name: 'Kapsabet (Nandi)', code: '66063' },
    { name: 'Kericho', code: '66064' },
    // Western / Nyanza
    { name: 'Kakamega', code: '66065' },
    { name: 'Bungoma', code: '66066' },
    { name: 'Kisumu', code: '66067' },
    { name: 'Kisii', code: '66068' },
  ],
  'Gulf African Bank': [
    // Nairobi County
    { name: 'Head Office', code: '72001' },
    { name: 'Westlands', code: '72010' },
    { name: 'Eastleigh', code: '72011' },
    // Coast (stronghold)
    { name: 'Mombasa', code: '72040' },
    { name: 'Nyali (Mombasa)', code: '72041' },
    { name: 'Kilifi', code: '72042' },
    { name: 'Malindi (Kilifi)', code: '72043' },
    { name: 'Lamu', code: '72044' },
    { name: 'Kwale', code: '72045' },
    // North Eastern
    { name: 'Garissa', code: '72046' },
    { name: 'Wajir', code: '72047' },
    { name: 'Mandera', code: '72048' },
    { name: 'Isiolo', code: '72049' },
    { name: 'Marsabit', code: '72050' },
    // Rift Valley / Western
    { name: 'Nakuru', code: '72051' },
    { name: 'Eldoret (Uasin Gishu)', code: '72052' },
    { name: 'Kitale (Trans Nzoia)', code: '72053' },
    // Nyanza
    { name: 'Kisumu', code: '72054' },
    { name: 'Migori', code: '72055' },
  ],
  'First Community Bank': [
    // Nairobi County
    { name: 'Head Office', code: '74001' },
    { name: 'Westlands', code: '74010' },
    { name: 'Eastleigh', code: '74011' },
    // Coast
    { name: 'Mombasa', code: '74040' },
    { name: 'Nyali (Mombasa)', code: '74041' },
    { name: 'Kilifi', code: '74042' },
    { name: 'Malindi (Kilifi)', code: '74043' },
    { name: 'Lamu', code: '74044' },
    { name: 'Kwale', code: '74045' },
    // North Eastern (stronghold)
    { name: 'Garissa', code: '74060' },
    { name: 'Wajir', code: '74061' },
    { name: 'Mandera', code: '74062' },
    { name: 'Isiolo', code: '74063' },
    { name: 'Marsabit', code: '74064' },
    // Eastern
    { name: 'Meru', code: '74065' },
    // Rift Valley
    { name: 'Nakuru', code: '74066' },
    { name: 'Eldoret (Uasin Gishu)', code: '74067' },
    { name: 'Kitale (Trans Nzoia)', code: '74068' },
    // Nyanza
    { name: 'Kisumu', code: '74069' },
    { name: 'Migori', code: '74070' },
  ],
  'Bank of Africa': [
    // Nairobi County
    { name: 'Head Office', code: '19001' },
    { name: 'Westlands', code: '19010' },
    { name: 'Industrial Area', code: '19011' },
    { name: 'Kiambu Town', code: '19012' },
    { name: 'Thika (Kiambu)', code: '19013' },
    // Coast
    { name: 'Mombasa', code: '19040' },
    { name: 'Malindi (Kilifi)', code: '19041' },
    { name: 'Kilifi', code: '19042' },
    // Eastern / Central
    { name: 'Meru', code: '19043' },
    { name: 'Embu', code: '19044' },
    { name: 'Machakos', code: '19045' },
    { name: 'Nyeri', code: '19046' },
    // Rift Valley
    { name: 'Nakuru', code: '19047' },
    { name: 'Eldoret (Uasin Gishu)', code: '19048' },
    { name: 'Kitale (Trans Nzoia)', code: '19049' },
    { name: 'Kericho', code: '19050' },
    // Western
    { name: 'Kakamega', code: '19051' },
    { name: 'Bungoma', code: '19052' },
    // Nyanza
    { name: 'Kisumu', code: '19053' },
    { name: 'Kisii', code: '19054' },
    { name: 'Migori', code: '19055' },
  ],
  'HFC Bank': [
    // Nairobi County
    { name: 'Head Office', code: '61001' },
    { name: 'Westlands', code: '61010' },
    { name: 'Upperhill', code: '61011' },
    { name: 'Kiambu Town', code: '61012' },
    { name: 'Thika (Kiambu)', code: '61013' },
    // Coast
    { name: 'Mombasa', code: '61040' },
    { name: 'Malindi (Kilifi)', code: '61041' },
    // Eastern / Central
    { name: 'Meru', code: '61042' },
    { name: 'Embu', code: '61043' },
    { name: 'Machakos', code: '61044' },
    { name: 'Nyeri', code: '61045' },
    { name: 'Nanyuki (Laikipia)', code: '61046' },
    // Rift Valley
    { name: 'Nakuru', code: '61047' },
    { name: 'Eldoret (Uasin Gishu)', code: '61048' },
    { name: 'Kitale (Trans Nzoia)', code: '61049' },
    { name: 'Kericho', code: '61050' },
    { name: 'Narok', code: '61051' },
    { name: 'Kajiado', code: '61052' },
    // Western / Nyanza
    { name: 'Kakamega', code: '61053' },
    { name: 'Kisumu', code: '61054' },
    { name: 'Kisii', code: '61055' },
  ],
  'Guaranty Trust Bank': [
    // Nairobi County
    { name: 'Head Office', code: '76001' },
    { name: 'Westlands', code: '76010' },
    { name: 'Upperhill', code: '76011' },
    { name: 'Kiambu Town', code: '76012' },
    // Coast
    { name: 'Mombasa', code: '76040' },
    { name: 'Malindi (Kilifi)', code: '76041' },
    // Eastern / Central
    { name: 'Meru', code: '76042' },
    { name: 'Machakos', code: '76043' },
    { name: 'Nyeri', code: '76044' },
    // Rift Valley
    { name: 'Nakuru', code: '76045' },
    { name: 'Eldoret (Uasin Gishu)', code: '76046' },
    { name: 'Kericho', code: '76047' },
    { name: 'Kajiado', code: '76048' },
    // Western / Nyanza
    { name: 'Kakamega', code: '76049' },
    { name: 'Kisumu', code: '76050' },
    { name: 'Kisii', code: '76051' },
  ],
  'UBA Kenya': [
    // Nairobi County
    { name: 'Head Office', code: '76101' },
    { name: 'Westlands', code: '76110' },
    { name: 'Upperhill', code: '76111' },
    { name: 'Kiambu Town', code: '76112' },
    // Coast
    { name: 'Mombasa', code: '76140' },
    { name: 'Malindi (Kilifi)', code: '76141' },
    // Eastern / Central
    { name: 'Meru', code: '76142' },
    { name: 'Machakos', code: '76143' },
    { name: 'Nyeri', code: '76144' },
    // Rift Valley
    { name: 'Nakuru', code: '76145' },
    { name: 'Eldoret (Uasin Gishu)', code: '76146' },
    { name: 'Kericho', code: '76147' },
    // Western / Nyanza
    { name: 'Kakamega', code: '76148' },
    { name: 'Kisumu', code: '76149' },
    { name: 'Kisii', code: '76150' },
  ],
  'Consolidated Bank': [
    // Nairobi County
    { name: 'Head Office', code: '23001' },
    { name: 'Westlands', code: '23010' },
    { name: 'Industrial Area', code: '23011' },
    { name: 'Kiambu Town', code: '23012' },
    { name: 'Thika (Kiambu)', code: '23013' },
    // Coast
    { name: 'Mombasa', code: '23040' },
    { name: 'Malindi (Kilifi)', code: '23041' },
    { name: 'Voi (Taita Taveta)', code: '23042' },
    // North Eastern
    { name: 'Garissa', code: '23043' },
    // Eastern / Central
    { name: 'Meru', code: '23044' },
    { name: 'Embu', code: '23045' },
    { name: 'Machakos', code: '23046' },
    { name: 'Nyeri', code: '23047' },
    { name: "Murang'a", code: '23048' },
    { name: 'Kitui', code: '23049' },
    { name: 'Nanyuki (Laikipia)', code: '23050' },
    // Rift Valley
    { name: 'Nakuru', code: '23051' },
    { name: 'Eldoret (Uasin Gishu)', code: '23052' },
    { name: 'Kitale (Trans Nzoia)', code: '23053' },
    { name: 'Narok', code: '23054' },
    { name: 'Kajiado', code: '23055' },
    { name: 'Kericho', code: '23056' },
    // Western
    { name: 'Kakamega', code: '23057' },
    { name: 'Bungoma', code: '23058' },
    { name: 'Busia', code: '23059' },
    // Nyanza
    { name: 'Kisumu', code: '23060' },
    { name: 'Kisii', code: '23061' },
    { name: 'Migori', code: '23062' },
    { name: 'Homa Bay', code: '23063' },
    { name: 'Nyamira', code: '23064' },
    { name: 'Siaya', code: '23065' },
  ],
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  ON_LEAVE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
  RESIGNED: 'bg-gray-100 text-gray-600 border-gray-200',
  TERMINATED: 'bg-red-100 text-red-700 border-red-200',
  PROBATION: 'bg-blue-100 text-blue-700 border-blue-200',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterDept) params.set('department', filterDept)
    if (filterStatus) params.set('status', filterStatus)
    try {
      const [empRes, deptRes] = await Promise.all([
        fetch(`/api/employees?${params}`),
        fetch('/api/departments'),
      ])
      const [empData, deptData] = await Promise.all([empRes.json(), deptRes.json()])
      setEmployees(Array.isArray(empData) ? empData : [])
      setDepartments(Array.isArray(deptData) ? deptData : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [search, filterDept, filterStatus])

  useEffect(() => {
    const t = setTimeout(loadData, 300)
    return () => clearTimeout(t)
  }, [loadData])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Employees</h1>
          <p className="text-slate-500 text-sm">{employees.length} total records</p>
        </div>
        <button onClick={() => { setEditingEmployee(null); setShowForm(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-blue-200 text-sm">
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search name, email, code..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-40">
            <option value="">All Departments</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Status</option>
            {['ACTIVE','PROBATION','ON_LEAVE','SUSPENDED','RESIGNED','TERMINATED'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-500">Loading...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <UserX className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-semibold">No employees found</p>
            <p className="text-sm mt-1">Add your first employee to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Employee', 'Department', 'Type', 'Date Hired', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-sm">
                          {emp.profilePhoto ? (
                            <img src={emp.profilePhoto} alt="" className="w-full h-full object-cover" />
                          ) : `${emp.firstName[0]}${emp.lastName[0]}`}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{emp.firstName} {emp.lastName}</div>
                          <div className="text-slate-400 text-xs">{emp.employeeCode} · {emp.jobTitle}</div>
                          <div className="text-slate-400 text-xs">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-700 text-sm">{emp.department?.name || <span className="text-slate-400 italic">Unassigned</span>}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-600 text-sm">{emp.employmentType?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-600 text-sm">{formatDate(emp.dateHired)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[emp.employmentStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {emp.employmentStatus?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/employees/${emp.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Profile">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => { setEditingEmployee(emp); setShowForm(true) }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <a href={`mailto:${emp.email}`}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Send Email">
                          <Mail className="w-4 h-4" />
                        </a>
                        <a href={`tel:${emp.phone}`}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Call">
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <EmployeeFormModal
          employee={editingEmployee}
          departments={departments}
          employees={employees}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); loadData(); toast.success(editingEmployee ? 'Employee updated!' : 'Employee added successfully!') }}
        />
      )}
    </div>
  )
}

function FormField({ label, name, type = 'text', required = false, opts, form, set }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {opts ? (
        <select value={form[name]} onChange={e => set(name, e.target.value)} required={required}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900">
          <option value="">Select...</option>
          {opts.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o.replace(/_/g, ' ')}</option>)}
        </select>
      ) : (
        <input type={type} value={form[name]} onChange={e => set(name, e.target.value)} required={required}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" />
      )}
    </div>
  )
}

const INPUT_CLS = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900'

function SearchableDropdown({ label, value, onChange, options, placeholder, allowCustom }: {
  label: string; value: string; onChange: (v: string) => void
  options: string[]; placeholder: string; allowCustom?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (allowCustom && query.trim()) onChange(query.trim())
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [allowCustom, query, onChange])

  function select(opt: string) {
    onChange(opt)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <input
        type="text"
        value={open ? query : value}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setQuery(value); setOpen(true) }}
        onKeyDown={e => {
          if (allowCustom && e.key === 'Enter' && query.trim()) {
            e.preventDefault()
            select(query.trim())
          }
        }}
        placeholder={value || placeholder}
        className={INPUT_CLS}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {allowCustom && query.trim() && !options.some(o => o.toLowerCase() === query.toLowerCase()) && (
            <button type="button" onMouseDown={() => select(query.trim())}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-b border-slate-100 italic">
              Use &quot;{query.trim()}&quot;
            </button>
          )}
          {filtered.length === 0 && !(allowCustom && query.trim()) ? (
            <div className="px-3 py-2 text-sm text-slate-400">No results</div>
          ) : filtered.map(opt => (
            <button key={opt} type="button" onMouseDown={() => select(opt)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${opt === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BankBranchSelector({ form, set }: { form: any; set: (k: string, v: string) => void }) {
  const allBanks = Object.keys(KENYA_BANK_BRANCHES)
  const branches: BranchInfo[] = KENYA_BANK_BRANCHES[form.bankName] ?? []
  const branchNames = branches.map(b => b.name)

  function onBankChange(bank: string) {
    set('bankName', bank)
    set('bankBranch', '')
    set('bankCode', '')
  }

  function onBranchSelect(value: string) {
    const found = branches.find(b => b.name === value)
    set('bankBranch', value)
    set('bankCode', found?.code ?? '')
  }

  return (
    <>
      {/* Bank Name */}
      <SearchableDropdown
        label="Bank Name"
        value={form.bankName}
        onChange={onBankChange}
        options={allBanks}
        placeholder="Search bank..."
      />

      {/* Branch */}
      <div>
        <SearchableDropdown
          label="Bank Branch"
          value={form.bankBranch}
          onChange={onBranchSelect}
          options={branchNames}
          placeholder="Search or type branch..."
          allowCustom
        />
      </div>

      {/* Branch Code — auto-filled but editable */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Branch Code <span className="font-normal text-slate-400">(auto-filled)</span>
        </label>
        <input
          type="text"
          value={form.bankCode}
          onChange={e => set('bankCode', e.target.value)}
          placeholder="e.g. 01043"
          className={INPUT_CLS}
        />
      </div>
    </>
  )
}

function EmployeeFormModal({ employee, departments, employees, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('personal')
  const [form, setForm] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    personalEmail: employee?.personalEmail || '',
    phone: employee?.phone || '',
    nationalId: employee?.nationalId || '',
    dateOfBirth: employee?.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
    gender: employee?.gender || '',
    address: employee?.address || '',
    city: employee?.city || '',
    departmentId: employee?.departmentId || '',
    jobTitle: employee?.jobTitle || '',
    employmentType: employee?.employmentType || 'FULL_TIME',
    employmentStatus: employee?.employmentStatus || 'ACTIVE',
    dateHired: employee?.dateHired ? new Date(employee.dateHired).toISOString().split('T')[0] : '',
    probationEndDate: employee?.probationEndDate ? new Date(employee.probationEndDate).toISOString().split('T')[0] : '',
    basicSalary: employee?.basicSalary || '',
    managerId: employee?.managerId || '',
    bankName: employee?.bankName || '',
    bankBranch: employee?.bankBranch || '',
    bankCode: employee?.bankCode || '',
    bankAccount: employee?.bankAccount || '',
    mpesaPhone: employee?.mpesaPhone || '',
    kraPin: employee?.kraPin || '',
    shaNumber: employee?.shaNumber || '',
    nssfNumber: employee?.nssfNumber || '',
    emergencyContact: employee?.emergencyContact || '',
    emergencyPhone: employee?.emergencyPhone || '',
    role: 'EMPLOYEE',
    idFrontUrl: employee?.idFrontUrl || '',
    idBackUrl: employee?.idBackUrl || '',
    passportPhotoUrl: employee?.passportPhotoUrl || '',
    kraPinUrl: employee?.kraPinUrl || '',
    nhifCardUrl: employee?.nhifCardUrl || '',
    nssfCardUrl: employee?.nssfCardUrl || '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const [salesManagers, setSalesManagers] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/employees?userRole=SALES_MANAGER')
      .then(r => r.json())
      .then(d => setSalesManagers(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  // For new employees: store locally in form state
  function setDocLocal(field: string, dataUrl: string) { set(field, dataUrl) }
  // For existing employees: DocUpload uploads directly; update local preview too
  function onDocSaved(field: string, dataUrl: string) { set(field, dataUrl) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const url = employee ? `/api/employees/${employee.id}` : '/api/employees'
      const method = employee ? 'PATCH' : 'POST'
      // For existing employees, documents are already uploaded individually — exclude from payload
      const docFields = ['idFrontUrl','idBackUrl','passportPhotoUrl','kraPinUrl','nhifCardUrl','nssfCardUrl']
      const payload = employee
        ? Object.fromEntries(Object.entries(form).filter(([k]) => !docFields.includes(k)))
        : form
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSave()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'employment', label: 'Employment' },
    { id: 'financial', label: 'Financial' },
    { id: 'documents', label: 'Documents' },
  ]
  const tabOrder = ['personal', 'employment', 'financial', 'documents']

  // send contract resend action for existing employee
  async function resendContract() {
    if (!employee) return
    try {
      const res = await fetch(`/api/employees/${employee.id}/contract`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Contract sent to employee\'s email!')
    } catch {
      toast.error('Failed to send contract')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{employee ? `Editing ${employee.firstName} ${employee.lastName}` : 'Fill in the employee details below'}</p>
          </div>
          <div className="flex items-center gap-2">
            {employee && (
              <button type="button" onClick={resendContract}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
                <Send className="w-3 h-3" />Resend Contract
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-slate-100 flex-shrink-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-medium">{error}</div>}

            {activeTab === 'personal' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name" name="firstName" required form={form} set={set} />
                <FormField label="Last Name" name="lastName" required form={form} set={set} />
                <FormField label="Work Email" name="email" type="email" required form={form} set={set} />
                <FormField label="Personal Email" name="personalEmail" type="email" form={form} set={set} />
                <FormField label="Phone Number" name="phone" required form={form} set={set} />
                <FormField label="National ID / Passport" name="nationalId" form={form} set={set} />
                <FormField label="Date of Birth" name="dateOfBirth" type="date" form={form} set={set} />
                <FormField label="Gender" name="gender" opts={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other / Prefer not to say'}]} form={form} set={set} />
                <FormField label="City" name="city" form={form} set={set} />
                <FormField label="Address" name="address" form={form} set={set} />
                <FormField label="Emergency Contact Name" name="emergencyContact" form={form} set={set} />
                <FormField label="Emergency Contact Phone" name="emergencyPhone" form={form} set={set} />
              </div>
            )}

            {activeTab === 'employment' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Job Title" name="jobTitle" required form={form} set={set} />
                <FormField label="Department" name="departmentId" opts={departments.map((d: any) => ({ value: d.id, label: d.name }))} form={form} set={set} />
                <FormField label="Employment Type" name="employmentType" opts={['FULL_TIME','CONTRACT','INTERN','CONSULTANT'].map(v => ({ value: v, label: v.replace('_', ' ') }))} form={form} set={set} />
                <FormField label="Employment Status" name="employmentStatus" opts={['ACTIVE','PROBATION','ON_LEAVE','SUSPENDED','RESIGNED','TERMINATED'].map(v => ({ value: v, label: v.replace('_', ' ') }))} form={form} set={set} />
                <FormField label="Date Hired" name="dateHired" type="date" required form={form} set={set} />
                <FormField label="Probation End Date" name="probationEndDate" type="date" form={form} set={set} />
                <FormField
                  label={form.role === 'SALES_AGENT' ? 'Sales Manager' : 'Reporting Manager'}
                  name="managerId"
                  opts={
                    form.role === 'SALES_AGENT'
                      ? salesManagers.map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName} — ${e.jobTitle}` }))
                      : employees.filter((e: any) => e.id !== employee?.id).map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName} — ${e.jobTitle}` }))
                  }
                  form={form} set={set} />
                <FormField label="System Role" name="role" opts={[
                  {value:'EMPLOYEE',label:'Employee (Self-Service)'},
                  {value:'SALES_AGENT',label:'Sales Agent'},
                  {value:'SALES_MANAGER',label:'Sales Manager'},
                  {value:'DEPARTMENT_HEAD',label:'Department Head'},
                  {value:'HR_MANAGER',label:'HR Manager'},
                  {value:'FINANCE_OFFICER',label:'Finance Officer'},
                  {value:'SUPER_ADMIN',label:'Super Admin'},
                ]} form={form} set={set} />
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Basic Salary (KES)" name="basicSalary" type="number" form={form} set={set} />
                <FormField label="KRA PIN" name="kraPin" form={form} set={set} />
                <div className="col-span-2 pt-1 pb-0.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Government Contributions</p>
                </div>
                <FormField label="SHA Number (formerly NHIF)" name="shaNumber" form={form} set={set} />
                <FormField label="NSSF Number" name="nssfNumber" form={form} set={set} />
                <div className="col-span-2 pt-1 pb-0.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bank Details</p>
                </div>
                <BankBranchSelector form={form} set={set} />
                <FormField label="Account Number" name="bankAccount" form={form} set={set} />
                <div className="col-span-2 pt-1 pb-0.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Money</p>
                </div>
                <FormField label="M-Pesa Phone Number" name="mpesaPhone" form={form} set={set} />
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  Upload supporting documents. Accepted: images (JPG, PNG) and PDFs. Max 4 MB each.
                  {!employee && <span className="font-semibold text-blue-700"> An employment contract will be auto-generated and emailed for digital signing when you save.</span>}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {(['idFrontUrl','idBackUrl','passportPhotoUrl','kraPinUrl','nhifCardUrl','nssfCardUrl'] as const).map((field, i) => (
                    <DocUpload key={field}
                      label={['National ID — Front','National ID — Back','Passport Photo','KRA PIN Certificate','NHIF Card','NSSF Card'][i]}
                      field={field}
                      value={form[field]}
                      employeeId={employee?.id}
                      onSaved={onDocSaved}
                      onSetLocal={setDocLocal}
                      onClear={() => {
                        set(field, '')
                        if (employee?.id) {
                          fetch(`/api/employees/${employee.id}/documents`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ field, value: null }),
                          }).catch(console.error)
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            {activeTab !== 'personal' && (
              <button type="button"
                onClick={() => setActiveTab(tabOrder[tabOrder.indexOf(activeTab) - 1])}
                className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold hover:bg-slate-50 text-sm">
                ← Back
              </button>
            )}
            {activeTab !== 'documents' ? (
              <button type="button"
                onClick={() => setActiveTab(tabOrder[tabOrder.indexOf(activeTab) + 1])}
                className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-semibold text-sm">
                Next →
              </button>
            ) : (
              <>
                <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                    : employee ? '💾 Update Employee' : '✅ Add Employee & Send Contract'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function DocUpload({ label, field, value, employeeId, onSaved, onSetLocal, onClear }: {
  label: string
  field: string
  value: string
  employeeId?: string   // if set → upload immediately; otherwise store locally for new employee
  onSaved?: (field: string, dataUrl: string) => void
  onSetLocal?: (field: string, dataUrl: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const isImage = value.startsWith('data:image')

  async function handleFile(file: File) {
    const MAX = 4 * 1024 * 1024
    if (file.size > MAX) { setErr('Max 4 MB per file'); return }
    setErr('')
    const reader = new FileReader()
    reader.onload = async e => {
      const dataUrl = e.target?.result as string
      if (employeeId) {
        // Existing employee — upload immediately
        setUploading(true)
        try {
          const res = await fetch(`/api/employees/${employeeId}/documents`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field, value: dataUrl }),
          })
          if (!res.ok) { setErr('Upload failed'); return }
          onSaved?.(field, dataUrl)
        } catch { setErr('Upload failed') }
        finally { setUploading(false) }
      } else {
        // New employee — store locally, send with form POST
        onSetLocal?.(field, dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-500">{label}</label>
      {value ? (
        <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 group">
          {isImage ? (
            <img src={value} alt={label} className="w-full h-28 object-cover" />
          ) : (
            <div className="h-28 flex flex-col items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">PDF Uploaded</span>
            </div>
          )}
          <button type="button" onClick={onClear}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
            <X className="w-3 h-3" />
          </button>
          {employeeId && (
            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Saved</div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-60">
          {uploading
            ? <><div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /><span className="text-xs">Uploading...</span></>
            : <><Upload className="w-5 h-5" /><span className="text-xs font-medium">Click to upload</span><span className="text-xs text-slate-300">JPG, PNG or PDF · max 4 MB</span></>
          }
        </button>
      )}
      {err && <p className="text-xs text-red-500">{err}</p>}
      <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
    </div>
  )
}
