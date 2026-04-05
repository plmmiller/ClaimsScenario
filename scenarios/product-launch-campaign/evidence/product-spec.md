# SmartDrive Product Specification

**Product:** SmartDrive Usage-Based Auto Insurance
**Version:** 1.0 (Colorado Launch)
**Effective Date:** September 15, 2026
**Issuing Company:** Pinnacle Mutual Insurance
**State Filing Reference:** CO-DOI-2026-PA-0847

---

## Product Overview

SmartDrive is a usage-based auto insurance (UBI) product that uses smartphone-based telematics to measure driving behavior and reward safe drivers with premium discounts. The product is designed for the Colorado personal auto insurance market, targeting safe drivers aged 25-45 who are comfortable with technology and believe they deserve lower rates based on their actual driving habits.

---

## Telematics Technology

### SmartDrive App

| Feature | Detail |
|---------|--------|
| Platform | iOS 15+ and Android 12+ |
| Sensors Used | GPS, accelerometer, gyroscope, screen state detection |
| Data Collection | Automatic trip detection; records driving data whenever the vehicle is in motion |
| Battery Impact | Less than 5% additional daily battery usage (optimized background processing) |
| Data Upload | Real-time via cellular data or Wi-Fi (typically less than 5 MB/month) |
| Privacy Mode | Optional "pause tracking" for up to 72 hours per month without scoring penalty |

### Driving Score Algorithm

The SmartDrive Driving Score is calculated on a 0-100 scale based on six weighted factors:

| Factor | Weight | What It Measures | Scoring Method |
|--------|--------|-----------------|----------------|
| Speed | 20% | Adherence to posted speed limits using GPS and map data | Deductions for exceeding limits by 5+ mph |
| Braking | 20% | Frequency and intensity of hard braking events (>0.4g) | Fewer hard brakes = higher score |
| Acceleration | 15% | Frequency and intensity of rapid acceleration events (>0.3g) | Smoother acceleration = higher score |
| Cornering | 10% | Lateral G-force during turns (>0.3g) | Gentler cornering = higher score |
| Phone Distraction | 25% | Screen interaction while vehicle is in motion (>5 mph) | No phone use = maximum points |
| Time of Day | 10% | Proportion of driving during high-risk hours (midnight to 5 AM) | Less nighttime driving = higher score |

### Score Thresholds

| Score Range | Rating | Approximate % of Drivers | Discount Level |
|-------------|--------|-------------------------|----------------|
| 90-100 | Excellent | Top 10% | Maximum tier discount |
| 75-89 | Good | Next 25% | Moderate discount |
| 60-74 | Fair | Next 35% | Small discount |
| 40-59 | Below Average | Next 20% | No discount (base rate) |
| 0-39 | Poor | Bottom 10% | No discount (base rate, may not renew) |

**Important:** SmartDrive does NOT increase rates based on poor driving scores. The worst outcome is paying the base rate with no telematics discount. This is a key marketing differentiator and must be communicated clearly.

---

## Product Tiers

### SmartDrive Basic

| Coverage | Limits |
|----------|--------|
| Bodily Injury Liability | $50,000 / $100,000 |
| Property Damage Liability | $25,000 |
| Uninsured Motorist BI | $50,000 / $100,000 |
| Collision | $1,000 deductible |
| Comprehensive | $500 deductible |
| Medical Payments | $5,000 |
| Maximum Telematics Discount | 15% |
| Annual Premium Range (before discount) | $1,200 - $1,800 |

### SmartDrive Plus

| Coverage | Limits |
|----------|--------|
| Bodily Injury Liability | $100,000 / $300,000 |
| Property Damage Liability | $50,000 |
| Uninsured Motorist BI | $100,000 / $300,000 |
| Collision | $500 deductible |
| Comprehensive | $250 deductible |
| Medical Payments | $10,000 |
| Rental Reimbursement | $50/day, 30-day max |
| Maximum Telematics Discount | 25% |
| Annual Premium Range (before discount) | $1,600 - $2,400 |

### SmartDrive Elite

| Coverage | Limits |
|----------|--------|
| Bodily Injury Liability | $250,000 / $500,000 |
| Property Damage Liability | $100,000 |
| Uninsured Motorist BI | $250,000 / $500,000 |
| Collision | $250 deductible |
| Comprehensive | $100 deductible |
| Medical Payments | $25,000 |
| Rental Reimbursement | $75/day, 30-day max |
| Roadside Assistance | Included |
| New Car Replacement (first 2 model years) | Included |
| Maximum Telematics Discount | 30% |
| Annual Premium Range (before discount) | $2,000 - $3,200 |

---

## Monitoring Period and Discount Application

### Timeline

1. **Days 1-90 (Monitoring Period):** Customer pays the base rate. The SmartDrive app collects driving data and calculates the Driving Score. The customer can view their score in the app in real time.

2. **Day 91 (Score Lock-In):** The first Driving Score is finalized based on 90 days of driving data. The corresponding discount is applied to the policy effective immediately via mid-term endorsement.

3. **Months 4-12:** The Driving Score continues to update monthly based on a rolling 90-day average. The discount adjusts accordingly at each monthly recalculation. Discounts can increase but **never decrease below the Day 91 lock-in** during the first policy term.

4. **Renewal:** At renewal, the Driving Score resets and the discount is based on the most recent 90-day driving data. The floor protection (no decrease from Day 91) does not carry over to renewal.

### Key Marketing Points

- **No rate increase risk:** SmartDrive never charges more than the base rate, even for poor scores
- **Transparent scoring:** Customers can see their score and driving factors in real time
- **Privacy Mode:** Up to 72 hours per month of tracking pause without penalty
- **Data ownership:** Customers can request deletion of all driving data within 30 days of policy cancellation

---

## Commission Structure

### Agent Compensation

| Component | Rate | Details |
|-----------|------|---------|
| New Business Commission | 15% | First-year written premium |
| Renewal Commission | 12% | All renewal-year premiums |
| Volume Bonus | +2% | Applied when agency writes 20+ SmartDrive policies per quarter |
| Launch Incentive | $50/policy | Additional flat fee for each policy bound in first 90 days of launch |
| Co-op Marketing | 50/50 match | Up to $5,000/year per agency for approved local advertising |

### Agent Tools

- **SmartDrive Agent Portal:** Real-time quoting, policy management, and commission tracking
- **Marketing Asset Library:** Pre-approved digital ads, social media posts, print materials with agency co-branding
- **Lead Routing:** Digital marketing leads routed to nearest appointed agency by ZIP code
- **Training:** Online certification course (2 hours) plus monthly product update webinars

---

## Competitive Rate Comparison (Denver Metro, 35-year-old married, clean record)

| Carrier | Product | Annual Premium | Max UBI Discount | Net After Max Discount |
|---------|---------|---------------|------------------|----------------------|
| State Farm | Drive Safe & Save | $1,380 | 30% | $966 |
| Progressive | Snapshot | $1,350 | 30% | $945 |
| Root Insurance | Root App | $1,290 | 52% (claimed) | $619 (claimed) |
| **SmartDrive Plus** | **SmartDrive** | **$1,420** | **25%** | **$1,065** |
| Allstate | Drivewise | $1,510 | 25% | $1,133 |
| Liberty Mutual | RightTrack | $1,480 | 30% | $1,036 |

**Positioning Note:** SmartDrive is not the lowest base price. The competitive advantage is (1) app-only with no OBD device, (2) transparent real-time scoring, (3) privacy mode option, (4) no rate increase guarantee, and (5) local agent support that Root cannot offer.

---

## Target Metrics (First 6 Months)

| Metric | Target |
|--------|--------|
| Policies in Force | 2,000 |
| Premium Volume | $3.4 million |
| App Downloads | 8,000 |
| App-to-Quote Conversion | 35% |
| Quote-to-Bind Conversion | 25% |
| Average Policy Premium | $1,700 |
| Customer Retention (projected 12-month) | 85% |
| Average Driving Score | 72 |
| Agent Adoption (of 12 agencies) | 100% quoting, 80%+ actively selling |

---

*This document is confidential and intended for internal use only. All rates are subject to Colorado Division of Insurance approval and may change prior to launch.*
