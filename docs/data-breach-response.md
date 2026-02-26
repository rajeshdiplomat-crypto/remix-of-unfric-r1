# Data Breach Response Plan — unfric

## 1. Detection

- Monitor authentication logs for anomalies (mass login failures, unusual IP patterns)
- Monitor database access patterns for bulk data reads
- Review edge function logs for unauthorized access attempts
- Set up alerts for any admin-level operations

## 2. Incident Logging

When a breach is detected or suspected:

1. **Log the incident** with:
   - Date and time of detection
   - Nature of the breach (data type affected, scope)
   - How it was detected
   - Systems affected
   - Estimated number of users impacted

2. **Contain the breach**:
   - Revoke compromised credentials immediately
   - Rotate API keys and service role keys
   - Disable affected endpoints if necessary
   - Preserve logs for forensic analysis

## 3. User Notification

### GDPR Requirement
Notify affected users within **72 hours** of becoming aware of a breach that poses a risk to their rights.

### Notification Template

**Subject:** Important Security Notice from unfric

Dear [User],

We are writing to inform you of a security incident that may have affected your account.

**What happened:**
[Brief, clear description of the incident]

**What data was affected:**
[List specific data types — e.g., email addresses, journal entries]

**What we've done:**
- [Action taken to contain the breach]
- [Steps to prevent recurrence]

**What you should do:**
- Change your password immediately
- Review your account for any unusual activity
- Contact us at privacy@unfric.com if you notice anything suspicious

**Contact:**
If you have questions or concerns, please reach out to privacy@unfric.com.

We sincerely apologize for any inconvenience and are committed to protecting your data.

— The unfric team

## 4. Post-Incident Review

- Conduct a full root cause analysis
- Document lessons learned
- Update security measures
- Review and update this response plan
- Consider engaging external security auditors
