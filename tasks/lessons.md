# Lessons Learned

<!-- Format: [date] | what went wrong | rule to avoid it -->

[2026-03-26] | API base URL was Android-emulator specific and failed on web | Always resolve API base URL by platform and support web-specific environment override.
