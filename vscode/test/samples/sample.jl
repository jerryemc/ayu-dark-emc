module Sim

"""
    step!(state, dt)

Advance the simulation by `dt`.
"""
Base.@kwdef struct Params
    dt::Float64 = 1e-3
    steps::Int = 1_000
end

const G = 9.81

function step!(x::Vector{Float64}, p::Params)
    @inbounds for i in eachindex(x)
        x[i] += p.dt * G * sin(x[i])
    end
    println("done: $(length(x)) items")
    return nothing
end

end # module
