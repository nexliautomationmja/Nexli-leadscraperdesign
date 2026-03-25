# 🛡️ Subdomain Setup Guide for Instantly.ai

## Why Use a Subdomain?

**Main Domain:** `nexli.com` (protected for website, important business emails)
**Subdomain:** `outreach.nexli.com` (for cold outreach campaigns)

### Benefits:
- ✅ Protects main domain reputation
- ✅ Better email deliverability
- ✅ Isolates cold email from business email
- ✅ Can use multiple subdomains for different campaigns
- ✅ If subdomain gets flagged → main domain stays safe

---

## Step-by-Step Setup

### 1. Choose Your Subdomain

Recommended options:
- `outreach.nexli.com` ⭐ (most common)
- `mail.nexli.com`
- `hello.nexli.com`
- `reach.nexli.com`

### 2. Configure DNS Records

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)

#### SPF Record
```
Type: TXT
Name: outreach
Value: v=spf1 include:_spf.instantly.ai ~all
TTL: 3600
```

#### DKIM Records (get from Instantly.ai)
After adding your email in Instantly, they'll provide 2-3 DKIM records like:

```
Type: TXT
Name: instantly1._domainkey.outreach
Value: k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA... (long key from Instantly)
TTL: 3600
```

#### DMARC Record
```
Type: TXT
Name: _dmarc.outreach
Value: v=DMARC1; p=none; rua=mailto:dmarc@nexli.com
TTL: 3600
```

#### Custom Tracking Domain (Optional but Recommended)
```
Type: CNAME
Name: track.outreach
Value: track.instantly.ai
TTL: 3600
```

### 3. Add Email Account in Instantly.ai

1. Log into [Instantly.ai](https://app.instantly.ai)
2. Go to **Settings → Email Accounts**
3. Click **"Add Email Account"**
4. Enter: `justine@outreach.nexli.com`
5. Instantly will verify your DNS records
6. Wait for **green checkmarks** ✓ on:
   - SPF ✓
   - DKIM ✓
   - DMARC ✓

**Important:** DNS propagation can take 24-48 hours, but usually completes in 1-2 hours.

### 4. Update Environment Variables

#### In Vercel:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **Nexli-leadscraperdesign**
3. Go to **Settings → Environment Variables**
4. Add these variables:

```bash
FROM_EMAIL=justine@outreach.nexli.com
FROM_NAME=Justine
```

5. Click **Save**
6. **Redeploy** your project for changes to take effect

#### In Local Development:
Update your `.env` file:

```bash
FROM_EMAIL="justine@outreach.nexli.com"
FROM_NAME="Justine"
```

### 5. Warm Up Your Subdomain (CRITICAL!)

**Don't start cold emailing immediately!** You need to warm up the subdomain:

1. In Instantly.ai, enable **"Email Warmup"** for your new account
2. Start with **10-20 emails/day**
3. Gradually increase over 2-3 weeks to 50-100/day
4. Instantly will automatically send/receive warm-up emails

**Recommended Warmup Schedule:**
- Week 1: 10-20 emails/day
- Week 2: 30-50 emails/day
- Week 3: 50-80 emails/day
- Week 4+: 80-120 emails/day

### 6. Test Your Setup

#### Check DNS Records:
```bash
# Check SPF
dig TXT outreach.nexli.com

# Check DKIM
dig TXT instantly1._domainkey.outreach.nexli.com

# Check DMARC
dig TXT _dmarc.outreach.nexli.com
```

#### Send Test Email:
1. In Nexli app, generate an email for any lead
2. Schedule it or send now
3. Check that it sends from `justine@outreach.nexli.com`
4. Verify in recipient's inbox (send to yourself first)

#### Check Email Headers:
Send a test email to yourself and check the headers:
- SPF should show: `PASS`
- DKIM should show: `PASS`
- DMARC should show: `PASS`

---

## Multiple Subdomains Strategy (Advanced)

For higher volume, use rotation:

```bash
# Subdomain 1
FROM_EMAIL="justine@outreach.nexli.com"

# Subdomain 2
FROM_EMAIL="justine@hello.nexli.com"

# Subdomain 3
FROM_EMAIL="justine@reach.nexli.com"
```

**Benefits:**
- Higher sending capacity (100 emails/day per subdomain)
- Better deliverability
- More resilience if one gets flagged

---

## Troubleshooting

### DNS Records Not Verified
- **Wait 1-2 hours** for DNS propagation
- Clear Instantly's cache by re-adding the email
- Use [MXToolbox](https://mxtoolbox.com/SuperTool.aspx) to verify records

### Emails Going to Spam
- **Warm up longer** (2-3 weeks minimum)
- Check SPF/DKIM/DMARC are all passing
- Reduce sending volume
- Improve email content (avoid spam words)
- Add unsubscribe link

### "From" Email Not Changing
- Check Vercel environment variables are set
- Redeploy the project after adding variables
- Clear browser cache
- Check local `.env` file has correct values

---

## Best Practices

1. ✅ **Always warm up** new subdomains (2-3 weeks)
2. ✅ **Monitor deliverability** in Instantly dashboard
3. ✅ **Keep main domain clean** (never use for cold email)
4. ✅ **Use custom tracking domain** for better deliverability
5. ✅ **Stay under 100 emails/day** per subdomain initially
6. ✅ **Personalize emails** (don't send generic blasts)
7. ✅ **Include unsubscribe link** (required by law)
8. ✅ **Monitor bounce rates** (keep under 2%)

---

## Quick Reference

| Setting | Value |
|---------|-------|
| Main Domain | `nexli.com` (protected) |
| Subdomain | `outreach.nexli.com` (cold email) |
| SPF Record | `v=spf1 include:_spf.instantly.ai ~all` |
| Warmup Period | 2-3 weeks |
| Daily Limit | Start at 20/day, max 100/day |
| Environment Var | `FROM_EMAIL=justine@outreach.nexli.com` |

---

## Resources

- [Instantly.ai Documentation](https://help.instantly.ai)
- [SPF/DKIM/DMARC Guide](https://www.cloudflare.com/learning/dns/dns-records/dns-dmarc-record/)
- [Email Warmup Best Practices](https://help.instantly.ai/en/articles/5258578-how-to-warm-up-your-email-account)
- [MXToolbox (DNS Checker)](https://mxtoolbox.com)

---

**Need Help?** Check the Instantly.ai support docs or reach out to their support team.
