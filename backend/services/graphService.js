function computeGraphMetrics(members, supports) {
  // Edge case: Empty or null inputs
  if (!members || !Array.isArray(members) || members.length === 0) {
    return {
      num_members: 0,
      num_earners: 0,
      critical_members: [],
      max_chain_depth: 0,
      has_chain_risk: false,
      chain_details: []
    };
  }

  if (!supports || !Array.isArray(supports)) {
    supports = [];
  }

  const outDegree = {};
  const inDegree = {};

  members.forEach(m => {
    if (m && m.id) {
      outDegree[m.id] = 0;
      inDegree[m.id] = 0;
    }
  });

  // Edge case: Filter out invalid supports (null from/to, self-loops)
  const validSupports = supports.filter(s =>
    s && s.from && s.to && s.from !== s.to && outDegree[s.from] !== undefined && outDegree[s.to] !== undefined
  );

  validSupports.forEach(s => {
    outDegree[s.from]++;
    inDegree[s.to]++;
  });

  const earners = members.filter(m => m && m.role === "earner");
  const numEarners = earners.length;

  // Edge case: No earners - return safe defaults
  if (numEarners === 0) {
    return {
      num_members: members.length,
      num_earners: 0,
      critical_members: [],
      max_chain_depth: 0,
      has_chain_risk: false,
      chain_details: []
    };
  }

  // Base critical members: earners who support dependents
  let criticalMembers = earners
    .filter(e => e && e.id && outDegree[e.id] > 0)
    .map(e => e.id);

  // In all-earner households, identify critical earners based on additional criteria
  const numDependents = members.length - numEarners;
  if (numDependents === 0 && numEarners > 0) {
    // All members are earners - identify critical based on:
    // 1. Low income stability (< 0.5)
    // 2. Receives support from others (inDegree > 0)
    // 3. Provides support to other earners
    const allEarnerCritical = earners.filter(e => {
      if (!e || !e.id) return false;
      const hasLowStability = e.income_stability !== undefined && e.income_stability < 0.5;
      const receivesSupport = inDegree[e.id] > 0;
      const providesSupport = outDegree[e.id] > 0;
      return hasLowStability || receivesSupport || providesSupport;
    }).map(e => e.id);

    criticalMembers = [...new Set([...criticalMembers, ...allEarnerCritical])];

    // If still no critical members in all-earner household, mark earner with lowest stability as critical
    if (criticalMembers.length === 0 && earners.length > 0) {
      const sortedByStability = earners
        .filter(e => e && e.id)
        .sort((a, b) => (a.income_stability || 0.5) - (b.income_stability || 0.5));
      if (sortedByStability.length > 0) {
        criticalMembers.push(sortedByStability[0].id);
      }
    }
  }

  // Detect chain dependencies with circular dependency protection
  function findMaxChainDepth(startNode, visited = new Set(), depth = 0) {
    // Edge case: Prevent infinite recursion
    if (!startNode || visited.has(startNode) || depth > 50) {
      return 0;
    }

    visited.add(startNode);

    const dependents = validSupports
      .filter(s => s.from === startNode)
      .map(s => s.to);

    if (dependents.length === 0) return 1;

    // Edge case: Safe max calculation even with empty array
    const depths = dependents.map(dep => findMaxChainDepth(dep, new Set(visited), depth + 1));
    return 1 + (depths.length > 0 ? Math.max(...depths) : 0);
  }

  // Calculate chain metrics
  let maxChainDepth = 0;
  let hasChainRisk = false;
  const chainDetails = [];

  earners.forEach(earner => {
    if (!earner || !earner.id) return;

    const chainDepth = findMaxChainDepth(earner.id);
    if (chainDepth > maxChainDepth) {
      maxChainDepth = chainDepth;
    }

    // Chain risk exists if an earner supports 2+ people in a chain
    if (chainDepth > 2) {
      hasChainRisk = true;
      chainDetails.push({
        earner: earner.id,
        chainDepth: chainDepth,
        totalDependents: outDegree[earner.id] || 0
      });
    }
  });

  return {
    num_members: members.length,
    num_earners: numEarners,
    critical_members: criticalMembers,
    max_chain_depth: maxChainDepth,
    has_chain_risk: hasChainRisk,
    chain_details: chainDetails
  };
}

function extractApplicant(members) {
  if (!members || !Array.isArray(members) || members.length === 0) {
    return null;
  }
  return members.find(member => member.is_applicant === true) || null;
}

module.exports = { computeGraphMetrics, extractApplicant };
