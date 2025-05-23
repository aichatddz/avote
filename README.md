# Avote

**Abstract**
Avote is a decentralized anonymous voting system on the Ethereum blockchain. The voting result and the voter participation can be verified publicly, but individual ballot selections remain cryptographically concealed. Avote operates with three distinct roles.

**Sponsor**
Anyone can be a sponsor by depositing specified amount of ETH and specifies who has voting rights.

**Voter**
Voter who has voting right can submitted his ballot. The ballots are cryptographically concealed so nobody knows what they submit but the ballots can be tallied by counters.

**Counter**
To ensure system anonymity, the system introduces a group of counters as the third party to decrypt and tally ballots. The number of counters must be at least 2. To prevent collusion among counters, both the sponsor and voters can participate as counters by staking a required amount of ETH.

# Foundations of cryptography
### Homomorphic Encryption
To conceal ballots information without affecting tally, we first require a homomorphic encryption algorithm. Serveral different approaches can be employed to achieve this.

**Paillier** is an additively homomorphic encryption scheme which security relies on hardness of the Composite Residuosity Problem(CRP), which is closely related to integer factorization.

**Elgamal** is a multiplicative homomorphic encryption scheme which security relies on hardness of Discrete Logarithm Problem(DLP).

**EC-Elgamal** is like Elgamal that it's security relies on hardness of DLP, but it runs ellipse curve. It's an additively homomorphic encryption. 

We chose EC-Elgamal because it's more efficient due to its smaller key size. More importantly, EC-Elgamal is zero-knownledge-friendly, allowing easily implementation in circom, as well as in c/c++, golang and javascript.

### How EC-Elgamal works?
In circom, EC-Elgamal is base on baby jubjub curve(one kind of ellipse curves) due to it's zero-knownledge-friendly. It's asymmetric encryption. Each counter $C_i$ generates a private key $d_{C_i}$, and publishes his public key on the contract. The public key is calculated as $d_{C_i}G$, while G is base point on the curve.

# References

[Exploring Elliptic Curve Pairings](https://medium.com/@VitalikButerin/exploring-elliptic-curve-pairings-c73c1864e627) --Vitalik Buterin

[An approximate introduction to how zk-SNARKs are possible](https://vitalik.eth.limo/general/2021/01/26/snarks.html) --Vitalik Buterin
