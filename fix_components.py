import sys

def run():
    # Read the new DonationHistoryContent
    with open('new_donation_history.tsx', 'r') as f:
        new_donation_history = f.read()

    # Read the deleted components from tmp_donation_history.txt
    with open('tmp_donation_history.txt', 'r') as f:
        tmp_content = f.read()

    start_idx = tmp_content.find("export function DonorTrackContent() {")
    end_idx = tmp_content.find("export function DonorRequestsContent() {")

    if start_idx == -1 or end_idx == -1:
        print("Could not find boundaries in tmp")
        return

    # Extract the accidentally deleted components
    deleted_components = tmp_content[start_idx:end_idx]

    # Read the current file
    with open('src/pages/DonorFeatures.tsx', 'r') as f:
        current_content = f.read()

    # The current file has `new_donation_history.tsx` and then directly `DonorRequestsContent`
    # We just need to find DonorRequestsContent in current_content and insert deleted_components before it.
    insert_idx = current_content.find("export function DonorRequestsContent() {")

    if insert_idx == -1:
        print("Could not find insert idx in current file")
        return

    final_content = current_content[:insert_idx] + deleted_components + "\n" + current_content[insert_idx:]

    with open('src/pages/DonorFeatures.tsx', 'w') as f:
        f.write(final_content)
    print("Fixed components successfully")

run()
