// === IMPORT TO NEO4J AURA ===
// Instructions:
// 1. Go to https://console.neo4j.io
// 2. Click "Query" on your Aura instance
// 3. Copy and paste this ENTIRE file
// 4. Click "Run" (or press Ctrl+Enter)

// === NODES ===
CREATE (n0:Household {id:"bd7344fe83ca75173156c3839443ede3a8d2d3d0dd150d9092b16d36e56b0298"});
CREATE (n1:Person {role:"earner",income_stability:0.875,is_applicant:true,id:"7cac4a11f3cdba71689f3f7aeb96bac74fe9f0eb1ec959ebae2ac5de41f441db"});
CREATE (n2:IncomeSource {is_primary:true,amount_band:"high",volatility:0.15,type:"job",stability:0.9});
CREATE (n3:IncomeSource {is_primary:false,amount_band:"medium",volatility:0.25,type:"rental",stability:0.85});
CREATE (n4:Person {role:"earner",income_stability:0.65,is_applicant:false,id:"f71ba1085fb89219d72e9bcc254cc71867fe1a721c8914de6c704d7835e51fe5"});
CREATE (n5:IncomeSource {is_primary:true,amount_band:"medium",volatility:0.7,type:"freelance",stability:0.65});
CREATE (n6:Person {role:"earner",income_stability:0.95,is_applicant:false,id:"9ef106bd41d12c2e30a3328b165b7373894f5ab7c45fa7a709c8cb743237ebbf"});
CREATE (n7:IncomeSource {is_primary:true,amount_band:"low",volatility:0.1,type:"pension",stability:0.95});
CREATE (n8:Person {role:"dependent",income_stability:0,is_applicant:false,id:"840b21e8dd51d1ffe8eb881d043a9786e3a880942891e230470e26ae172c8699"});
CREATE (n9:Person {role:"dependent",income_stability:0,is_applicant:false,id:"07c4403d2553d85a27af1ca2e4343f41e8076bddb0896f35da09fa63c8b55194"});
CREATE (n10:Household {id:"a5549047c913cbd35e18f07d26314c098dd8c9fce63a5b423c6f5919f944719b"});
CREATE (n11:Person {role:"earner",income_stability:0.75,is_applicant:true,id:"3d58855ad351410ea51fc8f87001e57317467cf8f0709a16e0aa352cd1b4dafd"});
CREATE (n12:IncomeSource {is_primary:true,amount_band:"medium",volatility:0.3,type:"job",stability:0.75});
CREATE (n13:Person {role:"dependent",income_stability:0,is_applicant:false,id:"b6ff2925b9ddec799078d1a20069d9ed3811c8fdaf9cca564a578edd7f55fbf8"});
CREATE (n14:Person {role:"dependent",income_stability:0,is_applicant:false,id:"05e3b0afd456600bab9da93f44bba7496551ae9acbef14505b2b44f54de46450"});

// === RELATIONSHIPS ===
// Household 1 - Multi-earner household
MATCH (p:Person {id:"7cac4a11f3cdba71689f3f7aeb96bac74fe9f0eb1ec959ebae2ac5de41f441db"}), (h:Household {id:"bd7344fe83ca75173156c3839443ede3a8d2d3d0dd150d9092b16d36e56b0298"}) CREATE (p)-[:BELONGS_TO]->(h);
MATCH (p:Person {id:"f71ba1085fb89219d72e9bcc254cc71867fe1a721c8914de6c704d7835e51fe5"}), (h:Household {id:"bd7344fe83ca75173156c3839443ede3a8d2d3d0dd150d9092b16d36e56b0298"}) CREATE (p)-[:BELONGS_TO]->(h);
MATCH (p:Person {id:"9ef106bd41d12c2e30a3328b165b7373894f5ab7c45fa7a709c8cb743237ebbf"}), (h:Household {id:"bd7344fe83ca75173156c3839443ede3a8d2d3d0dd150d9092b16d36e56b0298"}) CREATE (p)-[:BELONGS_TO]->(h);
MATCH (p:Person {id:"840b21e8dd51d1ffe8eb881d043a9786e3a880942891e230470e26ae172c8699"}), (h:Household {id:"bd7344fe83ca75173156c3839443ede3a8d2d3d0dd150d9092b16d36e56b0298"}) CREATE (p)-[:BELONGS_TO]->(h);
MATCH (p:Person {id:"07c4403d2553d85a27af1ca2e4343f41e8076bddb0896f35da09fa63c8b55194"}), (h:Household {id:"bd7344fe83ca75173156c3839443ede3a8d2d3d0dd150d9092b16d36e56b0298"}) CREATE (p)-[:BELONGS_TO]->(h);

// Household 2 - Single earner household
MATCH (p:Person {id:"3d58855ad351410ea51fc8f87001e57317467cf8f0709a16e0aa352cd1b4dafd"}), (h:Household {id:"a5549047c913cbd35e18f07d26314c098dd8c9fce63a5b423c6f5919f944719b"}) CREATE (p)-[:BELONGS_TO]->(h);
MATCH (p:Person {id:"b6ff2925b9ddec799078d1a20069d9ed3811c8fdaf9cca564a578edd7f55fbf8"}), (h:Household {id:"a5549047c913cbd35e18f07d26314c098dd8c9fce63a5b423c6f5919f944719b"}) CREATE (p)-[:BELONGS_TO]->(h);
MATCH (p:Person {id:"05e3b0afd456600bab9da93f44bba7496551ae9acbef14505b2b44f54de46450"}), (h:Household {id:"a5549047c913cbd35e18f07d26314c098dd8c9fce63a5b423c6f5919f944719b"}) CREATE (p)-[:BELONGS_TO]->(h);

// Income sources
MATCH (p:Person {id:"7cac4a11f3cdba71689f3f7aeb96bac74fe9f0eb1ec959ebae2ac5de41f441db"}), (i:IncomeSource {type:"job", amount_band:"high"}) CREATE (p)-[:EARNS_FROM]->(i);
MATCH (p:Person {id:"7cac4a11f3cdba71689f3f7aeb96bac74fe9f0eb1ec959ebae2ac5de41f441db"}), (i:IncomeSource {type:"rental", amount_band:"medium"}) CREATE (p)-[:EARNS_FROM]->(i);
MATCH (p:Person {id:"f71ba1085fb89219d72e9bcc254cc71867fe1a721c8914de6c704d7835e51fe5"}), (i:IncomeSource {type:"freelance"}) CREATE (p)-[:EARNS_FROM]->(i);
MATCH (p:Person {id:"9ef106bd41d12c2e30a3328b165b7373894f5ab7c45fa7a709c8cb743237ebbf"}), (i:IncomeSource {type:"pension"}) CREATE (p)-[:EARNS_FROM]->(i);
MATCH (p:Person {id:"3d58855ad351410ea51fc8f87001e57317467cf8f0709a16e0aa352cd1b4dafd"}), (i:IncomeSource {type:"job", amount_band:"medium"}) CREATE (p)-[:EARNS_FROM]->(i);

// Support relationships
MATCH (e:Person {id:"7cac4a11f3cdba71689f3f7aeb96bac74fe9f0eb1ec959ebae2ac5de41f441db"}), (d:Person {id:"840b21e8dd51d1ffe8eb881d043a9786e3a880942891e230470e26ae172c8699"}) CREATE (e)-[:SUPPORTS {strength:0.8}]->(d);
MATCH (e:Person {id:"7cac4a11f3cdba71689f3f7aeb96bac74fe9f0eb1ec959ebae2ac5de41f441db"}), (d:Person {id:"07c4403d2553d85a27af1ca2e4343f41e8076bddb0896f35da09fa63c8b55194"}) CREATE (e)-[:SUPPORTS {strength:0.8}]->(d);
MATCH (e:Person {id:"f71ba1085fb89219d72e9bcc254cc71867fe1a721c8914de6c704d7835e51fe5"}), (d:Person {id:"840b21e8dd51d1ffe8eb881d043a9786e3a880942891e230470e26ae172c8699"}) CREATE (e)-[:SUPPORTS {strength:0.7}]->(d);
MATCH (e:Person {id:"f71ba1085fb89219d72e9bcc254cc71867fe1a721c8914de6c704d7835e51fe5"}), (d:Person {id:"07c4403d2553d85a27af1ca2e4343f41e8076bddb0896f35da09fa63c8b55194"}) CREATE (e)-[:SUPPORTS {strength:0.7}]->(d);
MATCH (e:Person {id:"3d58855ad351410ea51fc8f87001e57317467cf8f0709a16e0aa352cd1b4dafd"}), (d:Person {id:"b6ff2925b9ddec799078d1a20069d9ed3811c8fdaf9cca564a578edd7f55fbf8"}) CREATE (e)-[:SUPPORTS {strength:0.9}]->(d);
MATCH (e:Person {id:"3d58855ad351410ea51fc8f87001e57317467cf8f0709a16e0aa352cd1b4dafd"}), (d:Person {id:"05e3b0afd456600bab9da93f44bba7496551ae9acbef14505b2b44f54de46450"}) CREATE (e)-[:SUPPORTS {strength:0.9}]->(d);
