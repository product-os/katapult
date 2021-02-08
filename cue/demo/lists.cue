nums: [1,2,3,4,5,6]
nums: [ for index, n in nums if index == 0 { n*n } ]  // cycle error cannot modify item in-place using iteration
