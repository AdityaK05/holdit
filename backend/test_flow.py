import requests
import time
import os
import uuid
import uuid 

BASE_URL = "http://localhost:8001"

def run_tests():
    print("Testing API Health...")
    r = requests.get(f"{BASE_URL}/health")
    if r.status_code != 200:
        print(f"Health check failed: {r.text}")
        return False
    print("Health OK")

    print("\nTesting Registration...")
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": "Password123!",
        "name": "Test User",
        "phone": "+1234567890",
        "role": "CUSTOMER"
    })
    if r.status_code != 201:
        print(f"Register failed: {r.text}")
        return False
    print("Register OK")

    print("\nTesting Login...")
    r = requests.post(f"{BASE_URL}/auth/login", data={
        "username": email,
        "password": "Password123!"
    })
    if r.status_code != 200:
        print(f"Login failed: {r.text}")
        return False
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login OK")

    # Assuming we already have stores and products, but we might not.
    print("\nTesting Fetch Stores...")
    r = requests.get(f"{BASE_URL}/stores", headers=headers)
    if r.status_code != 200:
        print(f"Fetch stores failed: {r.text}")
        return False
    stores = r.json().get("data", {}).get("stores", [])
    print(f"Fetched {len(stores)} stores.")

    if not stores:
        print("No stores available. We may need to seed the db to fully e2e test.")
        return True

    print("\nTesting Fetch Products...")
    r = requests.get(f"{BASE_URL}/products", headers=headers)
    if r.status_code != 200:
        print(f"Fetch products failed: {r.text}")
        return False
    products = r.json().get("data", {}).get("products", [])
    print(f"Fetched {len(products)} products.")

    if not products:
        print("No products available.")
        return True

    # Try creating a payment locally? We need a reservation first.
    return True

if __name__ == "__main__":
    if run_tests():
        print("\nAll integration checks passed so far!")
    else:
        print("\nIntegration tests failed.")
