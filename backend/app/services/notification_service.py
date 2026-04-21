import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str) -> None:
    """Send an email. In dev mode, logs to console instead of sending."""
    if settings.mail_dev_console:
        logger.info(
            "\n--- DEV EMAIL ---\nTo: %s\nSubject: %s\n\n%s\n-----------------",
            to, subject, body,
        )
        return
    # Production: wire up fastapi-mail or SMTP here
    logger.warning("Email sending not configured for production")


async def notify_deadline_extended(
    assignee_email: str,
    assignee_name: str,
    property_address: str,
    new_due: str,
    reason: str,
) -> None:
    subject = f"Deadline extended — {property_address}"
    body = (
        f"Hi {assignee_name},\n\n"
        f"The deadline for {property_address} has been extended to {new_due}.\n"
        f"Reason: {reason}\n\n"
        "Please complete your submission by the new due date.\n"
    )
    await send_email(assignee_email, subject, body)


async def notify_assignment_delegated(
    delegate_email: str,
    delegate_name: str,
    delegator_name: str,
    property_address: str,
    level: int,
) -> None:
    subject = f"Assignment delegated to you — {property_address}"
    body = (
        f"Hi {delegate_name},\n\n"
        f"{delegator_name} has delegated '{property_address}' to you "
        f"as level-{level} delegate.\n"
        "You can now fill and submit the values form for this property.\n"
    )
    await send_email(delegate_email, subject, body)


async def send_reminder(
    assignee_email: str,
    assignee_name: str,
    property_address: str,
    due_date: str,
    reminder_type: str,
) -> None:
    subjects = {
        "initial": f"Action required — property values for {property_address}",
        "reminder_1": f"Reminder — values due soon for {property_address}",
        "reminder_2": f"Urgent — values due in 2 days for {property_address}",
        "escalation": f"SLA breach — {property_address} is overdue",
        "final": f"Final notice — {property_address}",
    }
    body = (
        f"Hi {assignee_name},\n\n"
        f"This is a {reminder_type.replace('_', ' ')} for '{property_address}'.\n"
        f"Due date: {due_date}\n\n"
        "Please log in and complete your submission.\n"
    )
    await send_email(assignee_email, subjects.get(reminder_type, "Reminder"), body)
