import sys

def replace():
    with open('src/pages/DonorFeatures.tsx', 'r') as f:
        content = f.read()

    start_str = "export function DonationHistoryContent() {"
    end_str = "export function DonorRequestsContent() {"

    start_idx = content.find(start_str)
    end_idx = content.find(end_str)

    if start_idx == -1 or end_idx == -1:
        print("Could not find boundaries")
        return

    with open('new_donation_history.tsx', 'r') as f:
        new_content = f.read()

    final_content = content[:start_idx] + new_content + "\n" + content[end_idx:]

    with open('src/pages/DonorFeatures.tsx', 'w') as f:
        f.write(final_content)
    print("Replaced successfully")

replace()
