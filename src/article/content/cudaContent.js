const cudaContent = {
    header: "CUDA (Compute Unified Device Architecture)",
    text: `CUDA (Compute Unified Device Architecture) is a parallel computing platform developed by NVIDIA. It allows programmers to utilize the GPU (Graphics Processing Unit — GPU cores) for performing computational tasks using programming languages such as C and C++.
    CUDA is a platform and programming model for CUDA-enabled GPUs. The platform exposes GPUs for general purpose computing. CUDA provides C/C++ language extension and APIs for programming and managing GPUs. 
 The CUDA platform is a software layer that gives direct access to the GPU's virtual instruction set and parallel computational elements, for the execution of compute kernels.
In CUDA programming, both CPUs and GPUs are used for computing. Typically, we refer to CPU and GPU system as host and device, respectively. CPUs and GPUs are separated platforms with their own memory space. Typically, we run serial workload on CPU and offload parallel computation to GPUs.`,
    contents: [
        {
            type: "header",
            text: "Cuda Programming Model"
        },
        {
            type: "text",
            text: `The CUDA programming model is a heterogeneous model in which both the CPU and GPU are used. In CUDA, the host refers to the CPU and its memory, while the device refers to the GPU and its memory. Code run on the host can manage memory on both the host and device, and also launches kernels which are functions executed on the device. These kernels are executed by many GPU threads in parallel.
Given the heterogeneous nature of the CUDA programming model, a typical sequence of operations for a CUDA C program is:`
        },
        {
            type: "code",
            code: `- Declare and allocate host and device memory.
- Initialize host data.
- Transfer data from the host to the device.
- Execute one or more kernels.
- Transfer results from the device to the host.`
        },
        {
            type: "image",
            src: "./cuda-progrma.png"
        },
        {
            type: "header",
            text: "Nvidia CUDA Compiler (NVCC)"
        },
        {
            type: "text",
            text: `Nvidia CUDA Compiler (NVCC) is a compiler by Nvidia intended for use with CUDA. It is proprietary software.`
        },
        {
            type: "image",
            src: "./NVCC.svg"
        },
        {
            type: "header",
            text: "Overview of how NVCC works"
        },
        {
            type: "code",
            code: `- Code Analysis: NVCC analyzes the source code to identify the device (GPU) and host (CPU) code sections.
- Separation of Host and Device Code: NVCC separates the host code, which runs on the CPU, from the device code, which will be executed on the GPU. 
- Compilation and Optimization: NVCC compiles the host code using a standard CPU compiler, such as GCC or MSVC, while it compiles the device code using the CUDA compiler provided by NVIDIA.
- GPU-specific Code Generation: NVCC generates GPU-specific machine code (PTX — Parallel Thread Execution) that represents the device code. This code is not directly executable on the GPU but serves as an intermediate representation.
- PTX Translation and Optimization: NVCC translates the PTX code into GPU-specific machine code (SASS — Scalable Assembly) using the NVIDIA GPU driver.
- Linking: NVCC links the host and device code together to create a single executable.`
        },
        {
            type: "header",
            text: "Hello World in CUDA"
        },        
        {
            type: "code",
            code: `// hello_world.cu

#include <stdio.h>

__global__ void hello_world_kernel()
{
    printf("Hello GPU World!\n");
}

int main()
{
    hello_world_kernel <<<1,5>>>();
    return 0;
}
`
        },
        {
            type: "header",
            text: "Compilaion and Execution"
        },        
        {
            type: "code",
            code: `
// CUDA program names must end in .cu
nvcc hello_world.cu -o hello_world // Compile the program
./hello_world // Execute the program
`
        },
        {
            type: "header",
            text: "Host vs Device code"
        },
        {
            type: "text",
            text: `CUDA calls code that is slated to run on the CPU host code, and functions that are bound for the GPU device code. You can tell the two of them apart by looking at the function signatures; device code has the __global__ or __device__ keyword at the beginning of the function, while host code has no such qualifier. It is after all supposed to run on the CPU so having a mandatory qualifier at the beginning when the rest of the internet is compiling without any at all doesn't make much sense. Sometimes you will equivalently see __host__, but this is an optional keyword.
When you use __device__ before a variable, you are making a variable that exists in what's capled the global memory space of the GPU, which can be accessed directly from threads in all blocks, and is accessible to threads in all blocks and the host using special CUDA functions that can copy variables to different places (these are latency-heavy operations though, so they should only be used suring times when performence is not necessary, such as the beginning and end of a program).
One copy of global memory-bound variables exist per GPU.
There is also the __host__ keyword. Equivalent to not using any keyword at all, this defines a plain-old C/C++ function. And finally, using __host__ __device__ together enables functions to run on both the CPU and GPU.
Host code does not wait for completion of kernel.`
        },
        {
            type: "subHeader",
            text: "__global__"
        },
        {
            type: "text",
            text: `The major difference between C and CUDA implementation is __global__ specifier and <<<...>>> syntax. The __global__ specifier indicates a function that runs on device (GPU). Such function can be called through host code and is also known as "kernels".`
        },
        {
            type: "subHeader",
            text: "__host__"
        },
        {
            type: "text",
            text: `__host__ keyword is optional and its equivalent to not using any keyword at all, this defines a plain-old C/C++ function.`
        },
        {
            type: "subHeader",
            text: "__host__ __device__"
        },
        {
            type: "text",
            text: `Using __host__ __device__ together enables functions to run on both the CPU and GPU.`
        },
        {
            type: "subHeader",
            text: "device vs global"
        },
        {
            type: "text",
            text: `device functions can be called only from the device, and it is executed only in the device.
global functions can be called from the host, and it is executed in the device.
Therefore, you call device functions from kernels functions, and you don't have to set the kernel settings. You can also "overload" a function, e.g : you can declare void foo(void) and device foo (void), then one is executed on the host and can only be called from a host function. The other is executed on the device and can only be called from a device or kernel function.`
        },
        {
            type: "subHeader",
            text: "Kernels"
        },
        {
            type: "text",
            text: `Functions that run on GPU.`
        },
        {
            type: "subHeader",
            text: "<<<...>>>"
        },
        {
            type: "text",
            text: `When a kernel is called, its execution configuration is provided through <<<...>>> syntax, e.g. cuda_hello<<<1,1>>>(). In CUDA terminology, this is called "kernel launch".`
        },

        {
            type: "header",
            text: "Vector Additional in CUDA - Serial"
        },        
        {
            type: "code",
            code: `// cuda_vector_add_serial.cu

#include <stdio.h>

#define N 10000000

__global__ void vector_add(float *out, float *a, float *b, int n) {
    for(int i = 0; i < n; i++){
        out[i] = a[i] + b[i];
    }
}

int main(){
    // Host - Variables
    float *a, *b, *out;

    // Device - Variables
    float *d_a, *d_b, *d_out;

    // Host - Allocate memory
    a   = (float*)malloc(sizeof(float) * N);
    b   = (float*)malloc(sizeof(float) * N);
    out = (float*)malloc(sizeof(float) * N);

    // Device - Allocate memory
    cudaMalloc((void**)&d_a, sizeof(float) * N);
    cudaMalloc((void**)&d_b, sizeof(float) * N);
    cudaMalloc((void**)&d_out, sizeof(float) * N);

    // Initialize array
    for(int i = 0; i < N; i++){
        a[i] = 1.0f; b[i] = 2.0f;
    }

    // Transfer data from host to device memory
    cudaMemcpy(d_a, a, sizeof(float) * N, cudaMemcpyHostToDevice);
    cudaMemcpy(d_b, b, sizeof(float) * N, cudaMemcpyHostToDevice);

    // Main function
    vector_add<<<1,1>>>(d_out, d_a, d_b, N);

    // Copy data from device array d_C to host array C
    cudaMemcpy(out, d_out, N, cudaMemcpyDeviceToHost);

     // Host - Free  memory
     free(a);
     free(b);
     free(out);
 
     // Device - Free memory
     cudaFree(d_a);
     cudaFree(d_b);
     cudaFree(d_out);

    printf("\n---------------------------\n");
    printf("__SUCCESS__\n");
    printf("---------------------------\n");
}

// Still not run program in parallel
`
        },
        {
            type: "header",
            text: "Device memory management"
        },
        {
            type: "text",
            text: `CPU and GPUs are separate entities. Both have their own memory space. CPU cannot directly access GPU memory, and vice versa. In CUDA terminology, CPU memory is called host memory and GPU memory is called device memory. Pointers to CPU and GPU memory are called host pointer and device pointer, respectively.
For data to be accessible by GPU, it must be presented in the device memory. CUDA provides APIs for allocating device memory and data transfer between host and device memory.`
        },
        {
            type: "subHeader",
            text: "Allocating device memory"
        },
        {
            type: "text",
            text: `CUDA provides several functions for allocating device memory. The most common ones are cudaMalloc() and cudaFree(). The syntax for both functions are as follows:`
        },
        {
            type: "code",
            code: `
cudaMalloc(void **devPtr, size_t count);
cudaFree(void *devPtr);
`
        },
        {
            type: "text",
            text: `cudaMalloc() allocates memory of size count in the device memory and updates the device pointer devPtr to the allocated memory. cudaFree() deallocates a region of the device memory where the device pointer devPtr points to. They are comparable to malloc() and free() in C, respectively.`
        },
        {
            type: "subHeader",
            text: "Memory transfer"
        },
        {
            type: "text",
            text: `Transfering data between host and device memory can be done through cudaMemcpy function, which is similar to memcpy in C. The syntax of cudaMemcpy is as follow:`
        },
        {
            type: "code",
            code: `
cudaMemcpy(void *dst, void *src, size_t count, cudaMemcpyKind kind);
`
        },
        {
            type: "text",
            text: `The function copy a memory of size count from src to dst. kind indicates the direction. For typical usage, the value of kind is either cudaMemcpyHostToDevice or cudaMemcpyDeviceToHost.`
        },
        {
            type: "header",
            text: "CPU vs GPU"
        },
        {
            type: "text",
            text: `This difference in capabilities between the GPU and the CPU exists because they are designed with different goals in mind. While the CPU is designed to excel at executing a sequence of operations, called a thread, as fast as possible and can execute a few tens of these threads in parallel, the GPU is designed to excel at executing thousands of them in parallel (amortizing the slower single-thread performance to achieve greater throughput).
The GPU is designed to handle a large number of threads in parallel, and it is optimized for throughput. The CPU is designed to handle a smaller number of threads in parallel, and it is optimized for latency.
Because graphics cards are actually really slow, and can only do really simple operations like math. The benefit of graphics cards comes from it being able to do thousands of these simple things at the same time, such as processing thousands of polygons/pixels in parallel.
The GPU is specialized for highly parallel computations and therefore designed such that more transistors are devoted to data processing rather than data caching and flow control.
Devoting more transistors to data processing, for example, floating-point computations, is beneficial for highly parallel computations; the GPU can hide memory access latencies with computation, instead of relying on large data caches and complex flow control to avoid long memory access latencies, both of which are expensive in terms of transistors.
`
        },
        {
            type: "image",
            src: "./cpu-gpu-1.png"
        },
        {
            type: "header",
            text: "Heterogenous Computing"
        },
        {
            type: "text",
            text: `In general, an application has a mix of parallel parts and sequential parts, so systems are designed with a mix of GPUs and CPUs in order to maximize overall performance. Applications with a high degree of parallelism can exploit this massively parallel nature of the GPU to achieve higher performance than on the CPU.
Modern high-end HPC systems are heterogenous: They combine CPUs and GPUs, mapping tasks to the most suitable Processing Unit.
A typical heterogeneous compute node consists of two multicore CPU sockets and two or more many-core GPUs GPUs operate in conjunction with a CPU-based host typically through a PCI-Express bus.`
        },        
        {
            type: "image",
            src: "./cpu-gpu-2.png"
        },
        {
            type: "header",
            text: "Blocks, Grids, and Threads"
        },
        {
            type: "text",
            text: `When a kernel is launched, CUDA generates a grid of threads that are organized in a three-dimensional hierarchy.
Each grid is organized into an array of thread blocks or blocks. Each block can contain up to 1,024 threads.`
        },
        {
            type: "image",
            src: "./cuda-threads.png"
        },
        {
            type: "reference",
            href: "https://docs.nvidia.com/cuda/cuda-c-programming-guide/",
            text: "The Benefits of Using GPUs"
        },
        {
            type: "reference",
            href: "https://cuda-tutorial.readthedocs.io/en/latest/tutorials/tutorial01/",
            text: "cuda-tutorial"
        },
        {
            type: "reference",
            href: "https://dev.to/zenulabidin/an-overview-of-cuda-part-2-host-and-device-code-69d",
            text: "host-and-device-code"
        }
    ]
}
export default cudaContent;