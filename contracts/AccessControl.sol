// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AccessControl
 * @dev Governs patient-to-doctor permissions and stores doctor-specific encrypted AES keys.
 */
contract AccessControl {
    // Mapping: Patient => Doctor => Record ID => Has Access (boolean)
    mapping(address => mapping(address => mapping(string => bool))) private recordAccess;

    // Mapping: Patient => Doctor => Has Global Access (boolean)
    mapping(address => mapping(address => bool)) private globalAccess;

    // Mapping: User Address => Registered RSA Public Key (JWK or base64 string)
    mapping(address => string) private publicKeys;

    // Mapping: Patient => Doctor => Record ID => Doctor-specific Encrypted AES Key
    mapping(address => mapping(address => mapping(string => string))) private encryptedKeys;

    // Events
    event AccessGranted(address indexed patient, address indexed doctor, string recordId);
    event AccessRevoked(address indexed patient, address indexed doctor, string recordId);
    event GlobalAccessGranted(address indexed patient, address indexed doctor);
    event GlobalAccessRevoked(address indexed patient, address indexed doctor);
    event PublicKeyRegistered(address indexed user, string publicKey);

    /**
     * @notice Registers a user's RSA-OAEP public key.
     * @param pubKey The public key (JWK string or Base64 format).
     */
    function registerPublicKey(string memory pubKey) external {
        require(bytes(pubKey).length > 0, "Public key cannot be empty");
        publicKeys[msg.sender] = pubKey;
        emit PublicKeyRegistered(msg.sender, pubKey);
    }

    /**
     * @notice Gets a user's registered public key.
     * @param user The address of the user.
     * @return The registered public key string.
     */
    function getPublicKey(address user) external view returns (string memory) {
        return publicKeys[user];
    }

    /**
     * @notice Grants a doctor access to a specific record and stores the encrypted AES key.
     * @param doctor The doctor's address.
     * @param recordId The unique record identifier.
     * @param encryptedKey The record's AES key encrypted with the doctor's public key.
     */
    function grantAccess(address doctor, string memory recordId, string memory encryptedKey) external {
        require(doctor != address(0), "Invalid doctor address");
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        require(bytes(encryptedKey).length > 0, "Encrypted key cannot be empty");

        recordAccess[msg.sender][doctor][recordId] = true;
        encryptedKeys[msg.sender][doctor][recordId] = encryptedKey;

        emit AccessGranted(msg.sender, doctor, recordId);
    }

    /**
     * @notice Revokes a doctor's access to a specific record.
     * @param doctor The doctor's address.
     * @param recordId The unique record identifier.
     */
    function revokeAccess(address doctor, string memory recordId) external {
        require(doctor != address(0), "Invalid doctor address");
        require(bytes(recordId).length > 0, "Record ID cannot be empty");

        recordAccess[msg.sender][doctor][recordId] = false;
        delete encryptedKeys[msg.sender][doctor][recordId];

        emit AccessRevoked(msg.sender, doctor, recordId);
    }

    /**
     * @notice Grants a doctor global access to all patient records.
     * @param doctor The doctor's address.
     */
    function grantGlobalAccess(address doctor) external {
        require(doctor != address(0), "Invalid doctor address");
        globalAccess[msg.sender][doctor] = true;
        emit GlobalAccessGranted(msg.sender, doctor);
    }

    /**
     * @notice Revokes a doctor's global access to patient records.
     * @param doctor The doctor's address.
     */
    function revokeGlobalAccess(address doctor) external {
        require(doctor != address(0), "Invalid doctor address");
        globalAccess[msg.sender][doctor] = false;
        emit GlobalAccessRevoked(msg.sender, doctor);
    }

    /**
     * @notice Checks if a doctor has access to a specific record of a patient.
     * @param patient The patient's address.
     * @param doctor The doctor's address.
     * @param recordId The unique record identifier.
     * @return True if authorized, false otherwise.
     */
    function hasAccess(address patient, address doctor, string memory recordId) external view returns (bool) {
        return recordAccess[patient][doctor][recordId] || globalAccess[patient][doctor];
    }

    /**
     * @notice Checks if a doctor has global access to all records of a patient.
     * @param patient The patient's address.
     * @param doctor The doctor's address.
     * @return True if authorized globally, false otherwise.
     */
    function hasGlobalAccess(address patient, address doctor) external view returns (bool) {
        return globalAccess[patient][doctor];
    }

    /**
     * @notice Gets the encrypted key for a specific record. Caller must be the authorized doctor.
     * @param patient The patient's address.
     * @param recordId The unique record identifier.
     * @return The encrypted AES key.
     */
    function getEncryptedKey(address patient, string memory recordId) external view returns (string memory) {
        require(
            msg.sender == patient || recordAccess[patient][msg.sender][recordId] || globalAccess[patient][msg.sender],
            "Not authorized to get this key"
        );
        return encryptedKeys[patient][msg.sender][recordId];
    }
}
